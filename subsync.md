# ⚡ SubSync - Modern SaaS Subscription & Membership Management Platform

**SubSync** is a full-stack, enterprise-grade subscription and digital resource management platform built with the MERN stack (MongoDB, Express.js, React, Node.js) and styled with modern Glassmorphism, Aurora gradients, and fluid micro-interactions.

---

## 🌟 Platform Highlights & Core Capabilities

SubSync provides a unified ecosystem for tracking, managing, optimizing, and discovering recurring subscriptions, combined with a paid Digital Resource Vault and verifiable digital credentials.

### 1. 🛡️ SubSync Intelligence
- **AI Subscription Advisor**: Generates custom subscription health scores, redundancy audits, tier downgrade recommendations, and projected annual savings.
- **Contract & Renewal Sentinel**: Tracks contract renewal clauses, notice windows, auto-renewal trap alerts, and cancellation timelines.
- **Spending Velocity Forecast**: Predicts monthly recurring expenditures (MRR) based on historical cadence and seasonal fluctuations.

### 2. 🎁 Subscription Gifting Engine
- Create and send customized subscription vouchers with personalized messages and delivery schedules.
- Multi-tier gift cards with cryptographic 16-character redemption codes (`SS-XXXX-XXXX-XXXX`).
- One-click gift redemption system with real-time balance crediting.

### 3. 🎓 Skill Passport & Digital Vault
- Verified micro-credentials and interactive skill badges unlocked via learning milestones.
- Publicly verifiable credential URLs (`/passport/:username`) with dynamic QR code verification.
- **Digital Vault**: 50+ curated premium developer, UI/UX, and engineering handbooks in PDF format with dynamic download quotas.

### 4. 👥 Family & Team Shared Workspaces
- Shared subscription pools for team members or family groups.
- Split-billing calculators with seat allocation management.
- Member role management (Admin, Member, Viewer) with secure invite tokens.

### 5. 🔒 Trust Center & Security Transparency
- Enterprise-grade transparency report covering data handling, encryption protocols (AES-256 / TLS 1.3), and zero third-party data tracking.
- ISO 27001, SOC 2, and GDPR compliance posture documentation.
- Live platform service uptime monitor and system health dashboard.

### 6. 📄 Smart Subscription Scanner (OCR)
- Upload invoices, receipts, payment screenshots, and renewal emails (`.pdf`, `.png`, `.jpg`).
- Optical Character Recognition (OCR) extracts provider name, recurring cost, billing cycle, and renewal dates.
- Direct conversion of extracted receipt data into active tracked subscriptions.

### 7. ❌ 1-Click Cancellation Assistant
- Step-by-step verified cancellation guides for 15+ major global services (Netflix, Spotify, AWS, Adobe, LinkedIn, etc.).
- Legal cancellation demand letter generator with copyable notice templates.
- Cancellation retention shield auditing dark patterns used by subscription services.

### 8. 📊 Subscription Budget & Expense Planner
- Custom category-level budget limits (Entertainment, SaaS, Utilities, Cloud, etc.).
- Threshold alert warnings (at 80% and 100% capacity) preventing surprise overdrafts.
- Detailed export functionality: Export complete financial reports in **CSV** or styled **PDF**.

### 9. 🔍 Subscription Discovery & Comparison Hub
- Interactive discovery directory with 15+ curated subscription services across categories.
- Side-by-side service comparison matrix (features, pricing tiers, trial days, pros & cons).
- Personal user wishlists with price-drop tracking.

### 10. 🏆 SubSync Rewards & Loyalty Engine
- Gamified loyalty tier progression: **Bronze Member**, **Silver Patron**, **Gold VIP**, **SubSync Legend**.
- Referral link generation with instant bonus points on friend onboarding.
- Redeem points for real subscription discount codes, vault passes, and service perks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion animations |
| **Backend** | Node.js, Express.js (ES Modules), Multer, Morgan, Helmet, CORS |
| **Database** | MongoDB / MongoDB Atlas with Mongoose ODM |
| **Payments** | Razorpay Payment Gateway & Order Verification |
| **Document Processing** | Tesseract.js (OCR), PDFKit (Invoice & Report generation) |
| **Deployment** | Vercel (Frontend SPA) + Node.js persistent host / Serverless |

---

## 🚀 Quick Start Guide

### 1. Clone Repository
```bash
git clone https://github.com/menarayan15-boop/SubSync-Management-System.git
cd SubSync-Management-System
```

### 2. Configure Environment Variables
Copy `.env.example` in `backend/` and configure your credentials:
```bash
cp .env.example backend/.env
```
Ensure you provide:
- `MONGODB_URI`: Your MongoDB Atlas or local connection string
- `JWT_SECRET`: A secure random secret key
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Your Razorpay credentials

### 3. Install Dependencies & Start Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, and Backend API runs on `http://localhost:5000`.

---

## 🌐 Deploying to Vercel

1. Open [vercel.com/new](https://vercel.com/new).
2. Click **Import** next to `menarayan15-boop/SubSync-Management-System`.
3. In Project Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
4. Set Environment Variables:
   - `VITE_API_URL`: Your backend API URL (e.g. `https://your-backend.onrender.com/api`)
   - `VITE_RAZORPAY_KEY_ID`: Your Razorpay Key ID
5. Click **Deploy**!

---

© SubSync Team — Modern Subscription & Membership Management Platform.
