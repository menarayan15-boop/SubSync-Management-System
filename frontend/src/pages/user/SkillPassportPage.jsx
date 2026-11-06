import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Download,
  Share2,
  Copy,
  Check,
  FileText,
  ExternalLink,
  BookOpen,
  Zap,
  Layers,
  Compass,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

const BADGE_ICONS = {
  Sparkles,
  Compass,
  Zap,
  Award,
  Layers,
};

const SkillPassportPage = () => {
  const [passportData, setPassportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [privacyState, setPrivacyState] = useState('public');
  const [bioState, setBioState] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchPassportData();
  }, []);

  const fetchPassportData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/passport/summary');
      if (res.data?.success) {
        setPassportData(res.data.passport);
        setPrivacyState(res.data.passport.user?.passportPrivacy || 'public');
        setBioState(res.data.passport.user?.passportBio || '');
      }
    } catch (err) {
      console.error('Failed to load passport data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!passportData?.publicUrl) return;
    navigator.clipboard.writeText(passportData.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdatePrivacy = async () => {
    try {
      setIsUpdatingPrivacy(true);
      const res = await api.put('/passport/privacy', {
        passportPrivacy: privacyState,
        passportBio: bioState,
      });
      if (res.data?.success) {
        setAlert({ type: 'success', text: 'Passport privacy and bio updated successfully!' });
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Failed to update privacy settings.' });
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleDownloadCertificate = (certId) => {
    const token = localStorage.getItem('subsync_token') || '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.open(`${baseUrl}/passport/certificate/${certId}/download?token=${encodeURIComponent(token)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center text-[#6C4CF1] animate-spin mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-[#172033]">Loading Skill Passport...</h3>
        <p className="text-xs text-slate-500 mt-1">Calculating verified resource completions and credentials</p>
      </div>
    );
  }

  const { stats, badges = [], certificates = [], recentCompletions = [], user = {} } = passportData || {};

  return (
    <div className="min-h-screen py-8 sm:py-12 text-[#172033]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* HERO BANNER */}
        <div className="p-6 sm:p-8 liquid-glass rounded-3xl border border-white/80 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#6C4CF1]/10 via-[#3B82F6]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#3B82F6] text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C4CF1] bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200">
                  SubSync Skill Passport
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Verified Academic Records
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] mt-1 tracking-tight">
                My Skill Passport
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track technical progress, earn verified achievement badges, and export SubSync completion certificates.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={handleCopyLink}
              className="touch-target px-4 py-2.5 rounded-xl text-xs font-bold bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 shadow-sm flex items-center space-x-1.5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#6C4CF1]" />
                  <span>Share Passport</span>
                </>
              )}
            </button>
            <Link
              to="/resources"
              className="touch-target px-4 py-2.5 liquid-button text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Browse Vault</span>
            </Link>
          </div>
        </div>

        {/* NOTIFICATION ALERT */}
        {alert && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
              alert.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span>{alert.text}</span>
            <button onClick={() => setAlert(null)} className="font-bold">×</button>
          </div>
        )}

        {/* METRICS BENTO GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bento-card p-5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Publications Completed</span>
            <p className="text-3xl font-black text-[#172033] mt-1">{stats?.totalCompleted || 0}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Out of {stats?.catalogCount || 50} catalog items</p>
          </div>

          <div className="bento-card p-5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Curriculum Progress</span>
            <p className="text-3xl font-black text-[#6C4CF1] mt-1">{stats?.progressPercentage || 0}%</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#6C4CF1] to-[#3B82F6] h-1.5 rounded-full"
                style={{ width: `${stats?.progressPercentage || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bento-card p-5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Badges Unlocked</span>
            <p className="text-3xl font-black text-amber-600 mt-1">
              {stats?.earnedBadgesCount || 0} <span className="text-sm font-normal text-slate-400">/ {stats?.totalBadgesCount || 5}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Verified milestone achievements</p>
          </div>

          <div className="bento-card p-5">
            <span className="text-[10px] font-bold uppercase text-slate-400">Official Certificates</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">{stats?.certificatesCount || 0}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">PDF credentials available</p>
          </div>
        </div>

        {/* BADGES SHOWCASE */}
        <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div>
              <h2 className="text-xl font-black text-[#172033]">Achievement Badges</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Earned automatically upon meeting certified backend reading & comprehension thresholds.
              </p>
            </div>
            <span className="text-xs font-bold text-[#6C4CF1] bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
              {stats?.earnedBadgesCount} / {stats?.totalBadgesCount} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {badges.map((b) => {
              const IconComponent = BADGE_ICONS[b.icon] || Award;
              return (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border transition-all text-center flex flex-col items-center justify-between ${
                    b.isEarned
                      ? 'bg-white shadow-soft border-violet-200/80'
                      : 'bg-slate-50/70 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md mb-3 ${
                      b.isEarned ? `bg-gradient-to-br ${b.color}` : 'bg-slate-300'
                    }`}
                  >
                    {b.isEarned ? <IconComponent className="w-7 h-7" /> : <Lock className="w-6 h-6 text-slate-500" />}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-[#172033]">{b.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{b.description}</p>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase mt-3 px-2 py-0.5 rounded-full ${
                      b.isEarned
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {b.isEarned ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CERTIFICATES SECTION */}
        <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div>
              <h2 className="text-xl font-black text-[#172033]">SubSync Completion Certificates</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official certificates issued upon completing curriculum milestones (5 and 10 publications).
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              PDF Standard A4 Landscape
            </span>
          </div>

          {certificates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white/60 rounded-2xl border border-slate-200">
              No certificates issued yet. Complete 5 publications from the Digital Resource Vault to unlock your first certificate!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#6C4CF1] uppercase">
                        {cert.certificateId}
                      </span>
                      <h3 className="font-bold text-sm text-[#172033] mt-1">{cert.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Specialization: {cert.category}</p>
                    </div>
                    <Award className="w-6 h-6 text-emerald-600 shrink-0" />
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Issued: {new Date(cert.issueDate).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadCertificate(cert.certificateId)}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-[#6C4CF1] hover:text-white text-[#6C4CF1] font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRIVACY & SHARING CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bento-card p-6 space-y-4">
            <h3 className="font-bold text-base text-[#172033] pb-2 border-b border-slate-100">
              Passport Privacy & Bio
            </h3>
            <p className="text-xs text-slate-500">
              Control whether external visitors can inspect your verified skill portfolio. Sensitive information like email and payments are never exposed.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Visibility</label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setPrivacyState('public')}
                    className={`touch-target px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border ${
                      privacyState === 'public'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Public Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacyState('private')}
                    className={`touch-target px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border ${
                      privacyState === 'private'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <EyeOff className="w-4 h-4 text-rose-600" />
                    <span>Private (Hidden)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Public Bio</label>
                <textarea
                  rows="2"
                  value={bioState}
                  onChange={(e) => setBioState(e.target.value)}
                  placeholder="Share a short technical bio..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6C4CF1] bg-white"
                ></textarea>
              </div>

              <button
                type="button"
                onClick={handleUpdatePrivacy}
                disabled={isUpdatingPrivacy}
                className="px-4 py-2 bg-[#6C4CF1] hover:bg-[#5835ea] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {isUpdatingPrivacy ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bento-card p-6 space-y-4">
            <h3 className="font-bold text-base text-[#172033] pb-2 border-b border-slate-100">
              Shareable Public Portfolio
            </h3>
            <p className="text-xs text-slate-500">
              Showcase your technical badges and certifications to recruiters, peers, and collaborators.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 truncate select-all">
              {passportData?.publicUrl || window.location.href}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleCopyLink}
                className="touch-target px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy URL'}</span>
              </button>

              <Link
                to={`/passport/${user?.memberId || user?._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target px-4 py-2 bg-violet-50 hover:bg-violet-100 text-[#6C4CF1] text-xs font-bold rounded-xl flex items-center space-x-1.5"
              >
                <span>Preview Public Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillPassportPage;

