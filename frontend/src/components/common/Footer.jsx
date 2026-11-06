import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-brand-400 border border-slate-700">
                <img src="/logo.svg" alt="SubSync Logo" className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Sub<span className="text-brand-400">Sync</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              SubSync is an enterprise-grade membership management platform. Configure multi-tier subscriptions, automate recurring billing, track download quotas, and deliver exclusive assets with complete security.
            </p>
            <div className="flex items-center space-x-3 text-xs text-brand-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Razorpay Verified Sandbox • 256-Bit SSL Encryption</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/plans" className="text-slate-400 hover:text-white transition-colors">
                  Membership Tiers
                </Link>
              </li>
              <li>
                <Link to="/resources" className="text-slate-400 hover:text-white transition-colors">
                  Digital Asset Vault
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-slate-400 hover:text-white transition-colors">
                  Feature Comparison
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  Customer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Membership Tiers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Plans</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/plans" className="text-slate-400 hover:text-white transition-colors">
                  Free Starter
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-slate-400 hover:text-white transition-colors">
                  Bronze Edition
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-slate-400 hover:text-white transition-colors">
                  Silver Pro (Recommended)
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-slate-400 hover:text-white transition-colors">
                  Gold Enterprise VIP
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Help & Trust</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/support" className="text-slate-400 hover:text-white transition-colors">
                  Helpdesk & Tickets
                </Link>
              </li>
              <li>
                <a href="#faq" className="text-slate-400 hover:text-white transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <span className="text-slate-400 cursor-default">Privacy Policy</span>
              </li>
              <li>
                <span className="text-slate-400 cursor-default">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-navy-900 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SubSync Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <span>Built with React 19, Tailwind CSS & Node.js</span>
            <span className="text-slate-400">Status: Operational (99.99%)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
