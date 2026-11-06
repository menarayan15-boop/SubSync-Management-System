import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Gift,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const RedeemGiftPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [alert, setAlert] = useState(null);
  const [redeemSuccess, setRedeemSuccess] = useState(null);

  useEffect(() => {
    if (code) {
      handlePreview(code);
    }
  }, []);

  const handlePreview = async (inputCode) => {
    if (!inputCode || !inputCode.trim()) return;
    try {
      setLoadingPreview(true);
      setAlert(null);
      const res = await api.get(`/gifts/preview/${inputCode.trim().toUpperCase()}`);
      if (res.data?.success) {
        setPreview(res.data.gift);
      }
    } catch (err) {
      setPreview(null);
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Invalid or expired redemption code.',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRedeem = async () => {
    if (!user) {
      navigate(`/login?redirect=/redeem-gift?code=${encodeURIComponent(code)}`);
      return;
    }

    try {
      setRedeeming(true);
      setAlert(null);
      const res = await api.post('/gifts/redeem', {
        redemptionCode: code.trim().toUpperCase(),
      });

      if (res.data?.success) {
        setRedeemSuccess(res.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to redeem gift code.',
      });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen py-12 sm:py-20 text-[#172033] flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg mx-auto mb-4">
            <Gift className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-[#172033] tracking-tight">Redeem Gift Subscription</h1>
          <p className="text-xs text-slate-500 mt-1">
            Activate your gifted SubSync membership and unlock curated publications & HD video streaming.
          </p>
        </div>

        {alert && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs flex items-center justify-between ${
              alert.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{alert.text}</span>
            </div>
            <button onClick={() => setAlert(null)} className="font-bold text-slate-400">
              ×
            </button>
          </div>
        )}

        {redeemSuccess ? (
          <div className="liquid-glass rounded-3xl border border-emerald-200 shadow-glass p-8 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#172033]">Membership Activated! 🎉</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              {redeemSuccess.message}
            </p>
            <div className="pt-4 flex items-center justify-center space-x-3">
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-xl text-xs font-bold liquid-button shadow-md flex items-center space-x-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/resources"
                className="px-6 py-3 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 shadow-sm"
              >
                Browse Vault
              </Link>
            </div>
          </div>
        ) : (
          <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8 space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Enter Single-Use Redemption Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="GIFT-XXXX-XXXX"
                  className="w-full text-sm font-mono p-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C4CF1] outline-none bg-white uppercase font-bold"
                />
                <button
                  type="button"
                  onClick={() => handlePreview(code)}
                  disabled={loadingPreview || !code.trim()}
                  className="px-5 py-3 rounded-xl text-xs font-bold bg-[#6C4CF1] hover:bg-[#5835ea] text-white shrink-0 shadow-sm transition-all disabled:opacity-50"
                >
                  {loadingPreview ? 'Verifying...' : 'Check Code'}
                </button>
              </div>
            </div>

            {/* Preview Card */}
            {preview && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50/90 to-pink-50/90 border border-pink-200/80 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C4CF1]">
                    Valid Gift Found
                  </span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                    {preview.planName} Tier
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#172033]">
                  {preview.durationMonths} Month(s) of {preview.planName} Access
                </h3>

                <p className="text-xs text-slate-600 italic">
                  "{preview.personalMessage || 'Enjoy this SubSync gift membership!'}"
                </p>

                <div className="pt-2 border-t border-pink-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>From: <strong className="text-slate-800">{preview.senderName}</strong></span>
                  <span>Expires: {new Date(preview.expiresAt).toLocaleDateString()}</span>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleRedeem}
                    disabled={redeeming}
                    className="w-full py-3 rounded-xl text-xs font-bold liquid-button shadow-md flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {redeeming
                        ? 'Activating Subscription...'
                        : user
                        ? `Claim & Activate ${preview.planName} Membership`
                        : 'Sign In to Redeem Membership'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RedeemGiftPage;

