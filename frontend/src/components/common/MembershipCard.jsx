import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  QrCode,
  Share2,
  Download,
  Maximize2,
  X,
  Check,
  Copy,
  Calendar,
  ExternalLink,
  Award,
  Zap,
  RotateCw,
} from 'lucide-react';
import { generateQRCodeSVG } from '../../utils/qrCodeGenerator';

const TIER_THEMES = {
  Free: {
    bg: 'bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-950/90',
    border: 'border-slate-400/40',
    glow: 'shadow-[0_8px_32px_rgba(100,116,139,0.25)]',
    badge: 'bg-slate-200/90 text-slate-800 border-slate-300',
    accentText: 'text-slate-200',
    hologram: 'from-slate-400/20 via-white/10 to-transparent',
    iconColor: 'text-slate-300',
  },
  Bronze: {
    bg: 'bg-gradient-to-br from-[#2D1B0E]/95 via-[#452715]/85 to-[#1A0E06]/95',
    border: 'border-amber-600/50',
    glow: 'shadow-[0_8px_32px_rgba(217,119,6,0.3)]',
    badge: 'bg-amber-500 text-amber-950 border-amber-300 font-black',
    accentText: 'text-amber-300',
    hologram: 'from-amber-500/25 via-orange-300/15 to-transparent',
    iconColor: 'text-amber-400',
  },
  Silver: {
    bg: 'bg-gradient-to-br from-[#1E293B]/95 via-[#334155]/85 to-[#0F172A]/95',
    border: 'border-cyan-300/60',
    glow: 'shadow-[0_8px_32px_rgba(56,189,248,0.3)]',
    badge: 'bg-gradient-to-r from-slate-100 to-cyan-100 text-slate-900 border-cyan-200 font-black',
    accentText: 'text-cyan-300',
    hologram: 'from-cyan-400/25 via-slate-200/20 to-transparent',
    iconColor: 'text-cyan-300',
  },
  Gold: {
    bg: 'bg-gradient-to-br from-[#1C132E]/95 via-[#2E1A47]/85 to-[#0F0826]/95',
    border: 'border-amber-400/80',
    glow: 'shadow-[0_12px_40px_rgba(245,158,11,0.35)]',
    badge: 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-amber-950 border-yellow-200 font-black',
    accentText: 'text-amber-300',
    hologram: 'from-amber-400/30 via-violet-400/20 to-transparent',
    iconColor: 'text-amber-300',
  },
};

export const MembershipCard = ({
  cardData,
  className = '',
  allowFullscreen = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!cardData) return null;

  const {
    memberId = 'SS-MEM-0000',
    name = 'SubSync Member',
    avatar = '',
    tier = 'Free',
    status = 'Active',
    startDate = new Date(),
    expiryDate = null,
    perks = [],
    verificationUrl = '',
  } = cardData;

  const theme = TIER_THEMES[tier] || TIER_THEMES.Free;
  const qrSvgUrl = generateQRCodeSVG(verificationUrl || window.location.href, { size: 140 });

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(verificationUrl || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = (e) => {
    e.stopPropagation();
    window.print();
  };

  const CardFront = () => (
    <div
      className={`w-full h-full p-6 sm:p-7 flex flex-col justify-between text-white relative select-none rounded-3xl overflow-hidden backdrop-blur-2xl border ${theme.border} ${theme.bg} ${theme.glow}`}
    >
      {/* Hologram Diagonal Sweep */}
      <div
        className={`absolute inset-0 bg-gradient-to-tr ${theme.hologram} pointer-events-none opacity-60`}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] flex items-center justify-center font-black text-xs text-white shadow-md">
            SS
          </div>
          <div>
            <h4 className="text-sm font-black tracking-wider text-white">SUBSYNC</h4>
            <p className="text-[9px] uppercase tracking-widest text-white/60 font-semibold">
              Digital Pass
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${theme.badge}`}>
            {tier} Tier
          </span>
        </div>
      </div>

      {/* Middle Chip & Holographic Emblem */}
      <div className="my-4 flex items-center justify-between relative z-10">
        {/* Chip Graphic */}
        <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-amber-200/50 shadow-inner p-1.5 flex flex-col justify-between">
          <div className="w-full h-0.5 bg-amber-800/40 rounded-full" />
          <div className="w-full h-0.5 bg-amber-800/40 rounded-full" />
          <div className="w-full h-0.5 bg-amber-800/40 rounded-full" />
        </div>

        {/* Member ID Monospace */}
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">
            Member ID
          </p>
          <p className="font-mono text-sm sm:text-base font-bold text-white tracking-widest">
            {memberId}
          </p>
        </div>
      </div>

      {/* Bottom User Info & Expiry */}
      <div className="flex items-end justify-between relative z-10 pt-3 border-t border-white/10">
        <div className="flex items-center space-x-3">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-10 h-10 rounded-2xl object-cover border-2 border-white/60 shadow-md"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-white/60">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm sm:text-base font-bold text-white leading-tight truncate max-w-[170px]">
              {name}
            </p>
            <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              {status}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-white/50 uppercase font-semibold">
            {expiryDate ? 'Valid Thru' : 'Status'}
          </p>
          <p className="text-xs font-bold text-white">
            {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Active Member'}
          </p>
        </div>
      </div>
    </div>
  );

  const CardBack = () => (
    <div
      className={`w-full h-full p-6 sm:p-7 flex flex-col justify-between text-white relative select-none rounded-3xl overflow-hidden backdrop-blur-2xl border ${theme.border} ${theme.bg} ${theme.glow}`}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2">
          <ShieldCheck className={`w-5 h-5 ${theme.iconColor}`} />
          <span className="text-xs font-bold tracking-wider uppercase text-white/90">
            Cryptographic Verification
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/60">{memberId}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-2 relative z-10">
        {/* Real Dynamic QR Code */}
        <div className="p-2 bg-white rounded-2xl shadow-md border-2 border-white/80 shrink-0">
          <img
            src={qrSvgUrl}
            alt="Membership QR Code"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg"
          />
        </div>

        {/* Perks & Instructions */}
        <div className="flex-1 space-y-1.5 text-left">
          <p className="text-[11px] text-white/80 font-bold uppercase tracking-wider">
            Included Privileges:
          </p>
          <ul className="text-[11px] text-white/70 space-y-1">
            {perks.slice(0, 3).map((perk, i) => (
              <li key={i} className="flex items-center space-x-1.5">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{perk}</span>
              </li>
            ))}
          </ul>
          <p className="text-[9px] text-white/50 pt-1">
            Scan with any camera to verify official membership status.
          </p>
        </div>
      </div>

      {/* Footer Share Action */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
        <button
          onClick={handleCopy}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>

        <span className="text-[10px] text-white/50">SubSync Protocol v2.0</span>
      </div>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 3D Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full max-w-[420px] h-[240px] sm:h-[250px] cursor-pointer group mx-auto perspective-1000"
      >
        <div className="relative w-full h-full transition-transform duration-500 transform-style-3d">
          {isFlipped ? <CardBack /> : <CardFront />}
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex items-center justify-center space-x-2.5 max-w-[420px] mx-auto text-xs">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="touch-target px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm flex items-center space-x-1.5 transition-all pressable font-bold"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#6C4CF1]" />
          <span>{isFlipped ? 'Show Front' : 'Show QR Code'}</span>
        </button>

        <button
          onClick={handleCopy}
          className="touch-target px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm flex items-center space-x-1.5 transition-all pressable font-bold"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
          <span>{copied ? 'Link Copied' : 'Share Pass'}</span>
        </button>

        {allowFullscreen && (
          <button
            onClick={() => setIsFullscreen(true)}
            className="touch-target p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-sm flex items-center transition-all pressable"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
          </button>
        )}
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#172033]/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg space-y-4">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-[280px] sm:h-[310px] cursor-pointer"
            >
              {isFlipped ? <CardBack /> : <CardFront />}
            </div>

            <p className="text-center text-xs text-white/70">
              Click the pass to flip between identification details and secure QR verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipCard;

