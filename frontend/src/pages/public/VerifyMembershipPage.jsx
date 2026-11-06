import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Calendar,
  User,
  Award,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const VerifyMembershipPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No verification token provided. Please scan a valid SubSync Membership QR code.');
      return;
    }

    const verify = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/membership/verify`, {
          params: { token },
        });

        if (res.data.success && res.data.verified) {
          setResult(res.data.member);
        } else {
          setError(res.data.message || 'Membership verification failed.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Verification token is invalid, tampered, or expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-[#172033] py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-br from-violet-200/50 via-purple-100/30 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white flex items-center justify-center font-black text-sm shadow-md">
              SS
            </div>
            <span className="text-xl font-black tracking-tight text-[#172033]">
              SUBSYNC
            </span>
          </Link>
          <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
            Public Membership Verification Gateway
          </p>
        </div>

        {loading ? (
          <div className="liquid-glass p-8 rounded-3xl border border-white/90 shadow-glass text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#6C4CF1] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#172033]">
              Verifying Cryptographic Credentials...
            </p>
            <p className="text-xs text-slate-400">
              Validating signature against real-time MongoDB subscriber records.
            </p>
          </div>
        ) : error ? (
          <div className="liquid-glass p-8 rounded-3xl border border-rose-200 shadow-glass text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-rose-900">Verification Unsuccessful</h3>
            <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
            <div className="pt-4 border-t border-rose-100">
              <Link
                to="/"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm hover:bg-slate-800 transition-all"
              >
                <span>Return to Homepage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : result ? (
          <div className="liquid-glass p-8 rounded-3xl border border-emerald-200/80 shadow-glass space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Status */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Officially Verified Genuine</span>
              </span>
              <h2 className="text-xl font-extrabold text-[#172033]">
                {result.name}
              </h2>
              <p className="text-xs font-mono text-slate-500 font-semibold tracking-wider">
                ID: {result.memberId}
              </p>
            </div>

            {/* Verified Credentials Grid */}
            <div className="space-y-3 bg-white/70 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Membership Tier</span>
                <span className="font-extrabold text-[#6C4CF1] bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200">
                  {result.tier} Tier (Level {result.tierLevel})
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Account Status</span>
                <span className={`font-bold ${result.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {result.status}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Member Since</span>
                <span className="font-semibold text-slate-700">
                  {new Date(result.startDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Expiration / Renewal</span>
                <span className="font-semibold text-slate-700">
                  {result.expiryDate ? new Date(result.expiryDate).toLocaleDateString() : 'Continuous (Free)'}
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-[10px] text-slate-400">
                Cryptographically certified by SubSync Core Ledger at {new Date(result.verifiedAt).toLocaleTimeString()}.
              </p>
              <div className="mt-4">
                <Link
                  to="/"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#6C4CF1] hover:bg-[#5835ea] text-white text-xs font-bold shadow-md transition-all"
                >
                  <span>Explore SubSync Plans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VerifyMembershipPage;

