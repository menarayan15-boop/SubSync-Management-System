import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Award,
  Sparkles,
  ShieldCheck,
  Compass,
  Zap,
  Layers,
  Calendar,
  Lock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

const BADGE_ICONS = {
  Sparkles,
  Compass,
  Zap,
  Award,
  Layers,
};

const PublicPassportPage = () => {
  const { idOrMemberId } = useParams();
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicPassport();
  }, [idOrMemberId]);

  const fetchPublicPassport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/passport/public/${idOrMemberId}`);
      if (res.data?.success) {
        setPassport(res.data.passport);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('This Skill Passport has been set to private by the member.');
      } else {
        setError(err.response?.data?.message || 'Skill Passport profile not found.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center text-[#6C4CF1] animate-spin mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-[#172033]">Verifying Academic Credentials...</h3>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center text-center px-4">
        <div className="max-w-md w-full liquid-glass rounded-3xl p-8 border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#172033]">Portfolio Unavailable</h2>
          <p className="text-xs text-slate-500">{error || 'Skill Passport could not be loaded.'}</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#6C4CF1] text-white font-bold text-xs shadow-sm mt-2"
          >
            Return to SubSync
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 sm:py-16 text-[#172033]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* PROFILE HEADER */}
        <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md shrink-0">
              {passport.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified SubSync Learner</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] mt-1">{passport.name}</h1>
              <p className="text-xs text-slate-500 mt-1 max-w-lg">{passport.bio}</p>
            </div>
          </div>

          <div className="text-right self-start sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Member ID</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{passport.memberId}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Member since {new Date(passport.memberSince).getFullYear()}
            </span>
          </div>
        </div>

        {/* METRICS STATS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bento-card p-5 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Completed Works</span>
            <p className="text-3xl font-black text-[#172033] mt-1">{passport.totalCompleted}</p>
          </div>
          <div className="bento-card p-5 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Verified Badges</span>
            <p className="text-3xl font-black text-[#6C4CF1] mt-1">{passport.badges?.length || 0}</p>
          </div>
          <div className="bento-card p-5 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Certificates</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">{passport.certificates?.length || 0}</p>
          </div>
        </div>

        {/* BADGES GALLERY */}
        <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-black text-[#172033]">Verified Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {passport.badges?.map((b) => {
              const IconComp = BADGE_ICONS[b.icon] || Award;
              return (
                <div key={b.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-2 bg-gradient-to-br ${b.color}`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-xs text-[#172033]">{b.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* OFFICIAL CERTIFICATES */}
        {passport.certificates?.length > 0 && (
          <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-black text-[#172033]">SubSync Certificates</h2>
            <div className="space-y-3">
              {passport.certificates.map((cert) => (
                <div
                  key={cert.certificateId}
                  className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#6C4CF1] uppercase">
                      {cert.certificateId}
                    </span>
                    <h4 className="font-bold text-sm text-[#172033]">{cert.title}</h4>
                    <p className="text-[11px] text-slate-500">
                      {cert.category} • Issued {new Date(cert.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicPassportPage;

