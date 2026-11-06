import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  Quote,
  Star,
  Pause,
  Play,
  Heart,
  User,
} from 'lucide-react';
import { useDynamicComment } from '../../hooks/useDynamicComment';

const CATEGORY_STYLES = {
  violet: {
    badge: 'bg-violet-100/80 text-[#6C4CF1] border-violet-200/60',
    dot: 'bg-[#6C4CF1]',
    quote: 'text-[#6C4CF1]',
    gradient: 'from-violet-500/10 to-indigo-500/5',
  },
  emerald: {
    badge: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/60',
    dot: 'bg-emerald-600',
    quote: 'text-emerald-600',
    gradient: 'from-emerald-500/10 to-teal-500/5',
  },
  indigo: {
    badge: 'bg-indigo-100/80 text-indigo-800 border-indigo-200/60',
    dot: 'bg-indigo-600',
    quote: 'text-indigo-600',
    gradient: 'from-indigo-500/10 to-violet-500/5',
  },
  amber: {
    badge: 'bg-amber-100/80 text-amber-900 border-amber-200/60',
    dot: 'bg-amber-600',
    quote: 'text-amber-600',
    gradient: 'from-amber-500/10 to-orange-500/5',
  },
  sky: {
    badge: 'bg-sky-100/80 text-sky-800 border-sky-200/60',
    dot: 'bg-sky-600',
    quote: 'text-sky-600',
    gradient: 'from-sky-500/10 to-blue-500/5',
  },
  rose: {
    badge: 'bg-rose-100/80 text-rose-800 border-rose-200/60',
    dot: 'bg-rose-600',
    quote: 'text-rose-600',
    gradient: 'from-rose-500/10 to-pink-500/5',
  },
};

export const DynamicCommentCard = ({
  variant = 'spotlight',
  autoRotate = true,
  interval = 9000,
  className = '',
  title = 'Community Voices & Feedback',
  subtitle = 'Fresh perspective randomized on every page visit & refresh',
}) => {
  const {
    comment,
    index,
    total,
    isTransitioning,
    isPaused,
    setIsPaused,
    shuffleComment,
    nextComment,
    prevComment,
  } = useDynamicComment({ autoRotate, interval });

  const [avatarError, setAvatarError] = useState(false);
  const colorScheme = CATEGORY_STYLES[comment.tagColor] || CATEGORY_STYLES.violet;

  if (variant === 'compact') {
    return (
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`liquid-glass p-4 rounded-2xl border border-white/80 shadow-glass transition-all duration-300 relative overflow-hidden group ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${colorScheme.badge}`}>
            {comment.category}
          </span>
          <button
            onClick={shuffleComment}
            title="Show another comment"
            className="p-1 rounded-lg hover:bg-violet-100/50 text-slate-400 hover:text-[#6C4CF1] transition-colors"
            aria-label="Next random comment"
          >
            <Shuffle className="w-3 h-3" />
          </button>
        </div>

        <div
          className={`transition-all duration-300 min-h-[64px] flex flex-col justify-between ${
            isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
          }`}
        >
          <p className="text-xs text-slate-700 italic leading-relaxed line-clamp-3">
            "{comment.text}"
          </p>
          <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-100/80">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white flex items-center justify-center text-[9px] font-bold">
              {comment.initials}
            </div>
            <span className="text-[11px] font-bold text-[#172033] truncate">{comment.author}</span>
            <span className="text-[10px] text-slate-400 truncate">• {comment.role}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default 'spotlight' variant (Featured showcase card)
  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className={`liquid-glass p-6 sm:p-8 rounded-3xl border border-white/90 shadow-glass relative overflow-hidden transition-all duration-300 group ${className}`}
    >
      {/* Background Soft Aurora Reflection Blob */}
      <div
        className={`absolute -top-16 -right-16 w-60 h-60 bg-gradient-to-br ${colorScheme.gradient} rounded-full blur-3xl pointer-events-none transition-all duration-700`}
      />

      {/* Top Header: Badge, Live Pulse, and Interactive Shuffle Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 relative z-10 mb-5">
        <div className="flex items-center space-x-2">
          {/* Category Pill */}
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${colorScheme.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${colorScheme.dot} animate-pulse`} />
            <span>{comment.category}</span>
          </span>

          {/* Random on Refresh Live Tag */}
          <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] text-slate-500 bg-white/70 px-2.5 py-0.5 rounded-full border border-slate-200/60 font-medium">
            <Sparkles className="w-3 h-3 text-[#6C4CF1]" />
            <span>Changes each load</span>
          </span>
        </div>

        {/* Action Controls: Shuffle, Prev, Next, Pause Indicator */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden xs:inline">
            {index + 1} / {total}
          </span>

          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume auto-rotation' : 'Pause on this comment'}
            className="touch-target p-2 rounded-xl bg-white/60 hover:bg-white text-slate-500 hover:text-[#6C4CF1] border border-slate-200/60 transition-all pressable"
            aria-label={isPaused ? 'Resume comment rotation' : 'Pause comment rotation'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={prevComment}
            title="Previous comment"
            className="touch-target p-2 rounded-xl bg-white/60 hover:bg-white text-slate-500 hover:text-[#6C4CF1] border border-slate-200/60 transition-all pressable"
            aria-label="Previous comment"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={nextComment}
            title="Next comment"
            className="touch-target p-2 rounded-xl bg-white/60 hover:bg-white text-slate-500 hover:text-[#6C4CF1] border border-slate-200/60 transition-all pressable"
            aria-label="Next comment"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={shuffleComment}
            title="Pick a random comment"
            className="touch-target px-3 py-2 rounded-xl bg-[#6C4CF1] hover:bg-[#5835ea] text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all pressable"
            aria-label="Shuffle random comment"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>
      </div>

      {/* Main Content Area (Layout Shift Protected with Min-Height) */}
      <div className="min-h-[140px] sm:min-h-[120px] flex flex-col justify-center relative z-10 my-2">
        <div
          className={`transition-all duration-300 ease-out transform ${
            isTransitioning
              ? 'opacity-0 -translate-y-2 scale-[0.99]'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <div className="flex items-start space-x-3">
            <Quote
              className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 opacity-40 transition-colors mt-0.5 ${colorScheme.quote}`}
            />
            <p className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed italic">
              "{comment.text}"
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer: Author Profile, Rating & Transparency Label */}
      <div className="pt-5 mt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div
          className={`flex items-center space-x-3 transition-opacity duration-300 ${
            isTransitioning ? 'opacity-30' : 'opacity-100'
          }`}
        >
          {/* Avatar with reliable fallback */}
          {comment.avatar && !avatarError ? (
            <img
              src={comment.avatar}
              alt={comment.author}
              onError={() => setAvatarError(true)}
              className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-sm ring-2 ring-violet-200/50"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6C4CF1] to-[#4F46E5] text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-violet-200/50">
              {comment.initials}
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-[#172033]">{comment.author}</h4>
              <span className="text-[11px] text-slate-400 font-normal">{comment.handle}</span>
            </div>
            <p className="text-xs text-slate-500">{comment.role}</p>
          </div>
        </div>

        {/* Right Stars and Transparency Label */}
        <div className="flex items-center justify-between sm:justify-end space-x-3">
          <div className="flex items-center space-x-0.5 text-amber-400">
            {[...Array(comment.rating || 5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>

          <span className="text-[10px] text-slate-400 bg-white/70 px-2 py-0.5 rounded-full border border-slate-200/50">
            Sample Community Voice
          </span>
        </div>
      </div>
    </div>
  );
};

export default DynamicCommentCard;

