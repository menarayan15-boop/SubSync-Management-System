import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Resource from '../models/Resource.js';
import DownloadHistory from '../models/DownloadHistory.js';
import Notification from '../models/Notification.js';
import SupportTicket from '../models/SupportTicket.js';
import ActivityLog from '../models/ActivityLog.js';
import { connectDB } from '../config/db.js';
import { resourcesCatalog } from '../data/resourcesCatalog.js';
import { generateResourcePdf } from '../services/pdfGeneratorService.js';
import { seedDiscoveryServices } from './seedDiscovery.js';
import { seedRewardCatalogue } from './seedRewards.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('[Seeder] Checking and initializing database seeds...');

    // 1. Seed Subscription Plans if none exist
    const plansCount = await SubscriptionPlan.countDocuments();
    let freePlan, bronzePlan, silverPlan, goldPlan;

    if (plansCount === 0) {
      console.log('[Seeder] Seeding default subscription plans (Free, Bronze, Silver, Gold)...');

      const plans = [
        {
          name: 'Free',
          slug: 'free',
          tagline: 'Basic access to foundational courses and essential video access',
          description: 'Essential access for getting started with introductory video content and foundational courses.',
          tierLevel: 0,
          badge: 'Free Tier',
          monthlyPrice: 0,
          quarterlyPrice: 0,
          yearlyPrice: 0,
          currency: 'INR',
          quotas: {
            dailyDownloads: 1,
            monthlyDownloads: 30,
            streamingQuality: '480p',
            watchTimeLimit: 'Limited (30m/day)',
            adFree: false,
            maxDevices: 1,
            prioritySupport: false,
            analyticsAccess: false,
          },
          features: [
            { name: 'Limited premium video access', included: true },
            { name: '480p streaming', included: true },
            { name: 'One download per day', included: true },
            { name: 'Limited watch time', included: true },
            { name: 'Advertisements', included: true },
            { name: 'Restricted premium courses', included: false },
          ],
          isRecommended: false,
          isActive: true,
          sortOrder: 1,
        },
        {
          name: 'Bronze',
          slug: 'bronze',
          tagline: 'Enhanced viewing with 720p HD streaming and selected premium courses',
          description: 'Expands your access with higher daily downloads, crisp 720p streaming, and selected masterclasses.',
          tierLevel: 1,
          badge: 'Starter Plus',
          monthlyPrice: 99,
          quarterlyPrice: 269,
          yearlyPrice: 999,
          currency: 'INR',
          quotas: {
            dailyDownloads: 3,
            monthlyDownloads: 90,
            streamingQuality: '720p',
            watchTimeLimit: 'Increased (2h/day)',
            adFree: false,
            maxDevices: 2,
            prioritySupport: false,
            analyticsAccess: true,
          },
          features: [
            { name: 'Increased video access', included: true },
            { name: '720p streaming', included: true },
            { name: 'Three downloads per day', included: true },
            { name: 'Increased watch time', included: true },
            { name: 'Selected premium content', included: true },
          ],
          isRecommended: false,
          isActive: true,
          sortOrder: 2,
        },
        {
          name: 'Silver',
          slug: 'silver',
          tagline: 'Full HD 1080p, ad-free experience with exclusive course libraries',
          description: 'Ideal for enthusiasts wanting 1080p Full HD video playback, ad-free streaming, and priority content access.',
          tierLevel: 2,
          badge: 'Most Popular',
          monthlyPrice: 199,
          quarterlyPrice: 539,
          yearlyPrice: 1999,
          currency: 'INR',
          quotas: {
            dailyDownloads: 5,
            monthlyDownloads: 150,
            streamingQuality: '1080p Full HD',
            watchTimeLimit: 'Extensive (5h/day)',
            adFree: true,
            maxDevices: 4,
            prioritySupport: true,
            analyticsAccess: true,
          },
          features: [
            { name: 'Extensive video access', included: true },
            { name: '1080p streaming', included: true },
            { name: 'Five downloads per day', included: true },
            { name: 'Ad-free experience', included: true },
            { name: 'Exclusive courses', included: true },
            { name: 'Priority content access', included: true },
          ],
          isRecommended: true,
          isActive: true,
          sortOrder: 3,
        },
        {
          name: 'Gold',
          slug: 'gold',
          tagline: 'Unlimited eligible video access, 4K streaming & maximum platform benefits',
          description: 'The ultimate subscription experience with 4K Ultra HD streaming, 10 downloads/day, extended watch time, and all courses.',
          tierLevel: 3,
          badge: 'Ultimate Tier',
          monthlyPrice: 299,
          quarterlyPrice: 799,
          yearlyPrice: 2999,
          currency: 'INR',
          quotas: {
            dailyDownloads: 10,
            monthlyDownloads: 300,
            streamingQuality: '4K Ultra HD',
            watchTimeLimit: 'Unlimited',
            adFree: true,
            maxDevices: 8,
            prioritySupport: true,
            analyticsAccess: true,
          },
          features: [
            { name: 'Unlimited eligible video access', included: true },
            { name: '4K streaming where supported', included: true },
            { name: 'Ten downloads per day', included: true },
            { name: 'Extended watch time', included: true },
            { name: 'Ad-free experience', included: true },
            { name: 'All premium courses', included: true },
            { name: 'Priority content access', included: true },
            { name: 'Highest available platform benefits', included: true },
          ],
          isRecommended: false,
          isActive: true,
          sortOrder: 4,
        },
      ];

      for (const p of plans) {
        await SubscriptionPlan.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
      }

      freePlan = await SubscriptionPlan.findOne({ slug: 'free' });
      bronzePlan = await SubscriptionPlan.findOne({ slug: 'bronze' });
      silverPlan = await SubscriptionPlan.findOne({ slug: 'silver' });
      goldPlan = await SubscriptionPlan.findOne({ slug: 'gold' });
    } else {
      // Re-synchronize existing plans with current master specs
      const plans = [
        {
          slug: 'free',
          name: 'Free',
          tagline: 'Basic access to foundational courses and essential video access',
          monthlyPrice: 0,
          quarterlyPrice: 0,
          yearlyPrice: 0,
          quotas: { dailyDownloads: 1, monthlyDownloads: 30, streamingQuality: '480p', watchTimeLimit: 'Limited (30m/day)', adFree: false },
          features: [
            { name: 'Limited premium video access', included: true },
            { name: '480p streaming', included: true },
            { name: 'One download per day', included: true },
            { name: 'Limited watch time', included: true },
            { name: 'Advertisements', included: true },
            { name: 'Restricted premium courses', included: false },
          ]
        },
        {
          slug: 'bronze',
          name: 'Bronze',
          tagline: 'Enhanced viewing with 720p HD streaming and selected premium courses',
          monthlyPrice: 99,
          quarterlyPrice: 269,
          yearlyPrice: 999,
          quotas: { dailyDownloads: 3, monthlyDownloads: 90, streamingQuality: '720p', watchTimeLimit: 'Increased (2h/day)', adFree: false },
          features: [
            { name: 'Increased video access', included: true },
            { name: '720p streaming', included: true },
            { name: 'Three downloads per day', included: true },
            { name: 'Increased watch time', included: true },
            { name: 'Selected premium content', included: true },
          ]
        },
        {
          slug: 'silver',
          name: 'Silver',
          tagline: 'Full HD 1080p, ad-free experience with exclusive course libraries',
          monthlyPrice: 199,
          quarterlyPrice: 539,
          yearlyPrice: 1999,
          quotas: { dailyDownloads: 5, monthlyDownloads: 150, streamingQuality: '1080p Full HD', watchTimeLimit: 'Extensive (5h/day)', adFree: true },
          features: [
            { name: 'Extensive video access', included: true },
            { name: '1080p streaming', included: true },
            { name: 'Five downloads per day', included: true },
            { name: 'Ad-free experience', included: true },
            { name: 'Exclusive courses', included: true },
            { name: 'Priority content access', included: true },
          ]
        },
        {
          slug: 'gold',
          name: 'Gold',
          tagline: 'Unlimited eligible video access, 4K streaming & maximum platform benefits',
          monthlyPrice: 299,
          quarterlyPrice: 799,
          yearlyPrice: 2999,
          quotas: { dailyDownloads: 10, monthlyDownloads: 300, streamingQuality: '4K Ultra HD', watchTimeLimit: 'Unlimited', adFree: true },
          features: [
            { name: 'Unlimited eligible video access', included: true },
            { name: '4K streaming where supported', included: true },
            { name: 'Ten downloads per day', included: true },
            { name: 'Extended watch time', included: true },
            { name: 'Ad-free experience', included: true },
            { name: 'All premium courses', included: true },
            { name: 'Priority content access', included: true },
            { name: 'Highest available platform benefits', included: true },
          ]
        }
      ];

      for (const p of plans) {
        await SubscriptionPlan.findOneAndUpdate({ slug: p.slug }, { $set: p });
      }

      freePlan = await SubscriptionPlan.findOne({ slug: 'free' });
      bronzePlan = await SubscriptionPlan.findOne({ slug: 'bronze' });
      silverPlan = await SubscriptionPlan.findOne({ slug: 'silver' });
      goldPlan = await SubscriptionPlan.findOne({ slug: 'gold' });
    }

    // 2. Seed Admin & Demo Users if none exist
    let adminUser = await User.findOne({ email: 'admin@subsync.com' });
    if (!adminUser) {
      console.log('[Seeder] Creating default Admin user (admin@subsync.com)...');
      adminUser = await User.create({
        name: 'SubSync Administrator',
        email: 'admin@subsync.com',
        password: 'Admin@1234',
        role: 'admin',
        phone: '+91 98765 43210',
        isVerified: true,
      });
    }

    let demoUser = await User.findOne({ email: 'user@subsync.com' });
    if (!demoUser) {
      console.log('[Seeder] Creating default Demo user (user@subsync.com)...');
      demoUser = await User.create({
        name: 'Narayan Priyadarshi',
        email: 'user@subsync.com',
        password: 'User@1234',
        role: 'user',
        phone: '+91 98123 45678',
        isVerified: true,
      });

      // Enroll demo user in Silver Plan
      if (silverPlan) {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 25);

        const sub = await Subscription.create({
          user: demoUser._id,
          plan: silverPlan._id,
          billingCycle: 'monthly',
          status: 'Active',
          startDate: new Date(),
          endDate: nextMonth,
          nextBillingDate: nextMonth,
          amount: silverPlan.monthlyPrice,
          currency: 'INR',
          autoRenew: true,
        });

        // Seed initial payment & invoice for demo user
        const orderId = `order_${Date.now().toString().slice(-8)}`;
        const paymentId = `pay_${Date.now().toString().slice(-8)}`;

        const payment = await Payment.create({
          user: demoUser._id,
          subscription: sub._id,
          plan: silverPlan._id,
          orderId,
          paymentId,
          signature: 'simulated_sig_demo',
          amount: silverPlan.monthlyPrice,
          currency: 'INR',
          status: 'Successful',
          method: 'Razorpay UPI',
          billingCycle: 'monthly',
          invoiceNumber: 'INV-2026-00001',
        });

        await Invoice.create({
          invoiceNumber: 'INV-2026-00001',
          user: demoUser._id,
          subscription: sub._id,
          payment: payment._id,
          planName: 'Silver',
          billingCycle: 'monthly',
          subtotal: 846.61,
          taxRate: 18,
          taxAmount: 152.39,
          total: 999,
          currency: 'INR',
          status: 'Paid',
          items: [
            {
              description: 'SubSync Silver Membership (MONTHLY Billing)',
              amount: 846.61,
              quantity: 1,
            },
          ],
        });

        // Seed welcome notification
        await Notification.create({
          user: demoUser._id,
          title: 'Welcome to SubSync Silver!',
          message: 'Your membership is active with 50 daily downloads and priority support access.',
          type: 'subscription',
          link: '/dashboard',
        });
      }
    }

    // 3. Seed / Synchronize all 50 Publications across tiers in Digital Resource Vault
    console.log(`[Seeder] Synchronizing ${resourcesCatalog.length} publications in Digital Resource Vault...`);
    const uploadsDir = path.join(process.cwd(), 'uploads/resources');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const r of resourcesCatalog) {
      const pdfPath = path.join(uploadsDir, `${r.slug}.pdf`);
      if (!fs.existsSync(pdfPath)) {
        try {
          await generateResourcePdf(r);
        } catch (e) {
          console.error(`[Seeder] Could not generate PDF for ${r.slug}:`, e.message);
        }
      }

      await Resource.findOneAndUpdate(
        { slug: r.slug },
        {
          $set: {
            title: r.title,
            slug: r.slug,
            description: r.description,
            category: r.category,
            planLevelRequired: r.planLevelRequired,
            tierLevelRequired: r.tierLevelRequired,
            fileType: r.fileType || 'PDF',
            fileSize: r.fileSize || '3.5 MB',
            pageCount: r.pageCount || 8,
            filePath: `uploads/resources/${r.slug}.pdf`,
            fileUrl: `/uploads/resources/${r.slug}.pdf`,
            fileContent: r.description,
            highlights: r.highlights || [],
            tableOfContents: r.tableOfContents || [],
            tags: r.tags || [],
            isActive: true,
          },
          $setOnInsert: {
            downloadCount: Math.floor(Math.random() * 45) + 12,
            isFeatured: r.tierLevelRequired >= 2,
          },
        },
        { upsert: true, new: true }
      );
    }

    // 4. Seed sample support ticket
    const ticketCount = await SupportTicket.countDocuments();
    if (ticketCount === 0 && demoUser) {
      await SupportTicket.create({
        user: demoUser._id,
        ticketNumber: 'TICK-802194',
        category: 'Subscription Upgrade/Downgrade',
        subject: 'Inquiring about Gold plan annual multi-license discount',
        description: 'Hi team, our company is expanding to 10 team members. Does the Gold annual plan include multi-user seat pooling or do we configure child accounts?',
        priority: 'medium',
        status: 'In Progress',
        responses: [
          {
            user: demoUser._id,
            userName: demoUser.name,
            message: 'Hi team, our company is expanding to 10 team members. Does the Gold annual plan include multi-user seat pooling or do we configure child accounts?',
            isAdmin: false,
            createdAt: new Date(Date.now() - 3600000 * 5),
          },
          {
            user: adminUser._id,
            userName: adminUser.name,
            message: 'Hello Narayan! The Gold plan allows up to 15 concurrent devices and unrestricted shared team access. You can add your team directly from Settings.',
            isAdmin: true,
            createdAt: new Date(Date.now() - 3600000 * 2),
          },
        ],
      });
    }

    // 5. Seed verified Discovery Services and Reward Catalogue
    await seedDiscoveryServices();
    await seedRewardCatalogue();

    console.log('[Seeder] Seed check complete. All foundational data verified in MongoDB.');
  } catch (err) {
    console.error('[Seeder] Seed failed:', err.message);
  }
};

// If run directly from CLI
if (process.argv[1].endsWith('seed.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    process.exit(0);
  })();
}
