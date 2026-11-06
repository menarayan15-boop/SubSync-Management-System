import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { getApiBaseUrl } from '../../services/api';
import { TierBadge } from '../../components/common/Badge';
import {
  Search,
  Filter,
  Download,
  Lock,
  FileText,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  X,
  SlidersHorizontal,
  Bookmark,
  Clock,
  History,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const ResourcesPage = () => {
  const { user, subscription, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedSort, setSelectedSort] = useState('newest'); // 'newest', 'popular', 'alphabetical'
  const [viewMode, setViewMode] = useState('all'); // 'all', 'bookmarked', 'recent', 'history'
  
  const [bookmarks, setBookmarks] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [myDownloads, setMyDownloads] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [downloadingId, setDownloadingId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState(null);
  const [previewModalResource, setPreviewModalResource] = useState(null);

  const tiers = ['All', 'Free', 'Bronze', 'Silver', 'Gold'];
  const userTierLevel = subscription?.plan?.tierLevel ?? 0;
  const userPlanName = subscription?.plan?.name || 'Free';

  // Dynamic Category Extraction: Only shows categories that actually exist in the resource pool
  const categories = useMemo(() => {
    const cats = new Set(resources.map((r) => r.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [resources]);

  useEffect(() => {
    fetchResources();
    if (user) {
      fetchUserVaultData();
    }
  }, [selectedCategory, selectedTier, selectedSort]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedTier !== 'All') params.planLevel = selectedTier;
      if (search) params.search = search;
      if (selectedSort) params.sort = selectedSort;

      const res = await api.get('/resources', { params });
      if (res.data.success) {
        setResources(res.data.resources || []);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVaultData = async () => {
    try {
      const [bookRes, viewRes, dlRes] = await Promise.allSettled([
        api.get('/resources/user/bookmarks'),
        api.get('/resources/user/recently-viewed'),
        api.get('/resources/my-downloads'),
      ]);

      if (bookRes.status === 'fulfilled' && bookRes.value.data.success) {
        const ids = (bookRes.value.data.bookmarks || []).map((b) => (b._id ? b._id : b));
        setBookmarks(ids);
      }
      if (viewRes.status === 'fulfilled' && viewRes.value.data.success) {
        setRecentlyViewed(viewRes.value.data.recentlyViewed || []);
      }
      if (dlRes.status === 'fulfilled' && dlRes.value.data.success) {
        setMyDownloads(dlRes.value.data.downloads || []);
      }
    } catch (err) {
      console.error('Error fetching user vault metadata:', err);
    }
  };

  const handleToggleBookmark = async (e, resourceId) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/resources/${resourceId}/bookmark`);
      if (res.data.success) {
        if (res.data.isBookmarked) {
          setBookmarks((prev) => [...new Set([...prev, resourceId])]);
        } else {
          setBookmarks((prev) => prev.filter((id) => id !== resourceId));
        }
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleDownload = async (resource) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const hasAccess = userTierLevel >= resource.tierLevelRequired;
    if (!hasAccess) {
      setUpgradeModal({
        resourceTitle: resource.title,
        requiredTier: resource.planLevelRequired,
        currentTier: userPlanName,
      });
      return;
    }

    try {
      setDownloadingId(resource._id);
      setAlert(null);

      // Verify quota and record download in MongoDB
      const res = await api.post(`/resources/${resource._id}/download`);

      if (res.data.success) {
        setAlert({
          type: 'success',
          text: `Download verified! Starting download for "${resource.title}". Remaining quota: ${res.data.remainingDailyQuota} today.`,
        });

        // Trigger real authenticated file download
        const token = localStorage.getItem('subsync_token') || '';
        const baseUrl = getApiBaseUrl();
        const fileStreamUrl = `${baseUrl}/resources/${resource._id}/file?token=${encodeURIComponent(token)}`;

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = fileStreamUrl;
        a.setAttribute('download', `${resource.slug}.pdf`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Update local counts
        setResources((prev) =>
          prev.map((r) =>
            r._id === resource._id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r
          )
        );

        await refreshUser();
        fetchUserVaultData();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Download authorization failed.';
      setAlert({ type: 'error', text: errorMsg });
    } finally {
      setDownloadingId(null);
    }
  };

  const openPreview = async (resource) => {
    setPreviewModalResource(resource);
    if (user) {
      try {
        await api.post(`/resources/${resource._id}/view`);
        fetchUserVaultData();
      } catch (err) {
        // Non-blocking view tracking
      }
    }
  };

  // Filter resources based on active viewMode
  const displayedResources = useMemo(() => {
    let pool = resources;
    if (viewMode === 'bookmarked') {
      pool = resources.filter((r) => bookmarks.includes(r._id));
    } else if (viewMode === 'recent') {
      const recentIds = recentlyViewed.map((item) => item._id);
      pool = resources.filter((r) => recentIds.includes(r._id));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return pool;
  }, [resources, viewMode, bookmarks, recentlyViewed, search]);

  // Paginated slices
  const totalPages = Math.max(1, Math.ceil(displayedResources.length / itemsPerPage));
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return displayedResources.slice(start, start + itemsPerPage);
  }, [displayedResources, currentPage]);

  const getFileCategoryColor = (category) => {
    switch (category) {
      case 'Reports & Analytics':
      case 'Business':
      case 'Finance':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Developer SDKs & Code':
      case 'Programming':
      case 'Web Development':
        return 'text-violet-700 bg-violet-50 border-violet-200';
      case 'Design Assets & UI Kits':
        return 'text-pink-700 bg-pink-50 border-pink-200';
      case 'Security Audit Tools':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'Templates & Checklists':
      case 'Productivity':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default:
        return 'text-[#6C4CF1] bg-violet-50 border-violet-200';
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-[#172033] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Vault Hero & Live Quota Status */}
        <div className="liquid-glass rounded-3xl border border-white/90 p-6 sm:p-8 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6C4CF1] bg-violet-100/80 px-3 py-1 rounded-full border border-violet-200/60 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                SubSync 2.0 Digital Vault
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                • {resources.length} Publication-Grade Assets
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#172033] tracking-tight">
              Digital Resource Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Explore verified technical architecture blueprints, business intelligence guides, Figma design systems, cloud security audit checklists, and executive templates.
            </p>
          </div>

          {/* User Membership & Quota Status */}
          {user ? (
            <div className="bg-white/80 p-5 rounded-2xl border border-slate-200/80 shrink-0 text-right space-y-2 shadow-sm">
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Your Active Tier</p>
                <div className="flex items-center justify-end space-x-2 mt-0.5">
                  <span className="font-extrabold text-sm text-[#172033]">{userPlanName} Membership</span>
                  <TierBadge tier={userPlanName} />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Daily Downloads: <span className="font-bold text-slate-800">{user.usageQuota?.dailyDownloadsUsed || 0}</span> used
              </p>
              <Link
                to="/plans"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#172033] hover:bg-slate-800 text-white transition-all shadow-sm"
              >
                <span>Upgrade Plan</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              </Link>
            </div>
          ) : (
            <div className="bg-violet-50/80 p-5 rounded-2xl border border-violet-200/80 shrink-0 space-y-2">
              <p className="text-xs font-bold text-violet-900">Sign in to Download</p>
              <p className="text-[11px] text-violet-700 max-w-[200px]">
                Enjoy free publications or upgrade for elevated daily download quotas.
              </p>
              <Link
                to="/login"
                className="inline-block px-4 py-1.5 bg-[#6C4CF1] hover:bg-[#5835ea] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Action Alert Banner */}
        {alert && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-sm animate-in fade-in ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {alert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{alert.text}</span>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              ×
            </button>
          </div>
        )}

        {/* View Mode Tabs (All, Bookmarked, Recently Viewed, Download History) */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: `All Vault Resources (${resources.length})`, icon: Layers },
            { id: 'bookmarked', label: `Bookmarked (${bookmarks.length})`, icon: Bookmark },
            { id: 'recent', label: `Recently Viewed (${recentlyViewed.length})`, icon: Clock },
            { id: 'history', label: `My Downloads (${myDownloads.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setViewMode(tab.id);
                  setCurrentPage(1);
                }}
                className={`touch-target px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center space-x-2 transition-all pressable border ${
                  active
                    ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow-md shadow-violet-500/20'
                    : 'bg-white/80 text-slate-600 hover:text-[#172033] hover:bg-white border-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Download History Tab View */}
        {viewMode === 'history' ? (
          <div className="liquid-glass rounded-3xl border border-white/90 p-6 sm:p-8 shadow-glass space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <div>
                <h3 className="text-base font-bold text-[#172033]">Download Activity Ledger</h3>
                <p className="text-xs text-slate-500">Verified history of all publications downloaded to your account.</p>
              </div>
              <span className="text-xs font-bold text-[#6C4CF1] bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
                {myDownloads.length} Total Records
              </span>
            </div>

            {myDownloads.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">No downloads recorded yet</p>
                <p className="text-xs text-slate-400">Download any PDF from the vault to see it listed here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {myDownloads.map((item, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-100 text-[#6C4CF1] flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#172033]">{item.resourceTitle || item.resource?.title || 'PDF Document'}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(item.downloadedAt || item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Search, Tier & Category Filter Controls */}
            <div className="liquid-glass rounded-3xl border border-white/90 p-6 shadow-glass space-y-5">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search publications by title, topics, tags or tools..."
                    className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6C4CF1] transition-all"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Sort & Tier Filters */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  {/* Sort Dropdown */}
                  <div className="flex items-center space-x-2 bg-white/80 px-3 py-2 rounded-2xl border border-slate-200 shadow-sm">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500">Sort:</span>
                    <select
                      value={selectedSort}
                      onChange={(e) => setSelectedSort(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="popular">Most Popular</option>
                      <option value="alphabetical">Title (A-Z)</option>
                    </select>
                  </div>

                  {/* Tier Filters */}
                  <div className="flex items-center space-x-1 bg-white/80 p-1 rounded-2xl border border-slate-200 shadow-sm">
                    {tiers.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSelectedTier(t);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          selectedTier === t
                            ? 'bg-[#172033] text-white shadow-sm'
                            : 'text-slate-600 hover:text-[#172033] hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Category Tabs: Only shows categories with resources */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-slate-400 font-semibold shrink-0 flex items-center mr-2">
                  <Filter className="w-3.5 h-3.5 mr-1" /> Category:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-2 rounded-xl transition-all shrink-0 font-bold flex items-center space-x-1.5 ${
                      selectedCategory === cat
                        ? 'bg-[#6C4CF1] text-white shadow-sm'
                        : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-white'
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                ))}
              </div>

              {/* Resource Count Display */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                <span>
                  Showing <strong className="text-slate-900">{displayedResources.length}</strong> available publications
                  {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
                  {selectedTier !== 'All' && ` for ${selectedTier} plan`}
                </span>
                <span className="hidden sm:inline">Page {currentPage} of {totalPages}</span>
              </div>
            </div>

            {/* Resources Cards Grid */}
            {loading ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-[#6C4CF1] rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-semibold text-slate-500">Retrieving digital vault catalog...</p>
              </div>
            ) : paginatedResources.length === 0 ? (
              <div className="liquid-glass rounded-3xl border border-white/90 p-12 text-center max-w-md mx-auto shadow-glass space-y-3">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-[#172033] text-base">No matching publications found</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No resources matched your current search filters. Try clearing your search keyword or switching category tabs.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('All');
                    setSelectedTier('All');
                    setViewMode('all');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedResources.map((resource) => {
                  const hasAccess = userTierLevel >= resource.tierLevelRequired;
                  const isBookmarked = bookmarks.includes(resource._id);

                  return (
                    <div
                      key={resource._id}
                      className="liquid-glass rounded-3xl border border-white/80 shadow-glass hover:shadow-violet-glow transition-all p-6 flex flex-col justify-between group relative"
                    >
                      <div className="space-y-4">
                        {/* Top Metadata & Bookmark Button */}
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg border ${getFileCategoryColor(
                              resource.category
                            )}`}
                          >
                            {resource.category}
                          </span>
                          
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={(e) => handleToggleBookmark(e, resource._id)}
                              className={`p-1.5 rounded-xl border transition-all ${
                                isBookmarked
                                  ? 'bg-violet-100 text-[#6C4CF1] border-violet-200'
                                  : 'bg-white/80 text-slate-400 hover:text-[#6C4CF1] border-slate-200'
                              }`}
                              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this resource'}
                              aria-label="Bookmark resource"
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#6C4CF1]' : ''}`} />
                            </button>

                            <TierBadge tier={resource.planLevelRequired} />
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-base text-[#172033] leading-snug group-hover:text-[#6C4CF1] transition-colors">
                          {resource.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {resource.description}
                        </p>

                        {/* Specs / Document Attributes */}
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center">
                            <FileText className="w-3.5 h-3.5 text-[#6C4CF1] mr-1" />
                            PDF Document
                          </span>
                          <span>•</span>
                          <span>{resource.pageCount || 8} Pages</span>
                          <span>•</span>
                          <span>{resource.fileSize || '3.5 MB'}</span>
                        </div>

                        {/* Tags */}
                        {resource.tags && resource.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {resource.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/70 text-slate-600 border border-slate-200/60"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div className="mt-6 pt-4 border-t border-slate-100/90 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {resource.downloadCount || 0} Downloads
                        </span>

                        <div className="flex items-center space-x-2">
                          {/* Preview Details Button */}
                          <button
                            type="button"
                            onClick={() => openPreview(resource)}
                            className="touch-target px-3 py-1.5 text-slate-600 hover:text-[#6C4CF1] hover:bg-violet-50 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
                            title="View table of contents & details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Details</span>
                          </button>

                          {/* Download Button */}
                          <button
                            type="button"
                            onClick={() => handleDownload(resource)}
                            disabled={downloadingId === resource._id}
                            className={`touch-target px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
                              hasAccess
                                ? 'bg-[#172033] hover:bg-[#6C4CF1] text-white'
                                : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200'
                            }`}
                          >
                            {downloadingId === resource._id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : hasAccess ? (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Unlock ({resource.planLevelRequired})</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="touch-target px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1 text-xs font-bold">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl transition-all ${
                          currentPage === pageNum
                            ? 'bg-[#6C4CF1] text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="touch-target px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* RESOURCE PREVIEW MODAL */}
        {previewModalResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/70 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getFileCategoryColor(
                        previewModalResource.category
                      )}`}
                    >
                      {previewModalResource.category}
                    </span>
                    <TierBadge tier={previewModalResource.planLevelRequired} />
                  </div>
                  <h3 className="text-xl font-bold text-[#172033] leading-snug">
                    {previewModalResource.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewModalResource(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Executive Overview & Purpose
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {previewModalResource.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Format</p>
                  <p className="font-bold text-[#172033] mt-0.5">PDF Reference</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Length</p>
                  <p className="font-bold text-[#172033] mt-0.5">
                    {previewModalResource.pageCount || 8} Full Pages
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">File Size</p>
                  <p className="font-bold text-[#172033] mt-0.5">{previewModalResource.fileSize || '3.5 MB'}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Author</p>
                  <p className="font-bold text-[#172033] mt-0.5 truncate">SubSync Labs</p>
                </div>
              </div>

              {previewModalResource.highlights && previewModalResource.highlights.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Core Learning Deliverables
                  </h4>
                  <div className="space-y-2">
                    {previewModalResource.highlights.map((h, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewModalResource.tableOfContents && previewModalResource.tableOfContents.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Curriculum & Chapter Outline
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
                    {previewModalResource.tableOfContents.map((chap, idx) => (
                      <div
                        key={idx}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-medium text-[#172033]">
                          Chapter {chap.chapterNumber}: {chap.title}
                        </span>
                        <span className="text-slate-400 font-semibold">Page {chap.page}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewModalResource(null)}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close Preview
                </button>

                {userTierLevel >= previewModalResource.tierLevelRequired ? (
                  <button
                    type="button"
                    onClick={() => handleDownload(previewModalResource)}
                    disabled={downloadingId === previewModalResource._id}
                    className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-[#6C4CF1] hover:bg-[#5835ea] rounded-xl shadow-sm flex items-center justify-center space-x-2"
                  >
                    {downloadingId === previewModalResource._id ? (
                      <span>Verifying & Downloading...</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Complete PDF</span>
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to="/plans"
                    onClick={() => setPreviewModalResource(null)}
                    className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-[#172033] hover:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center space-x-2"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Upgrade to {previewModalResource.planLevelRequired} to Download</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* UPGRADE REQUIRED MODAL */}
        {upgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/70 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-[#172033]">Membership Upgrade Required</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>"{upgradeModal.resourceTitle}"</strong> requires a{' '}
                  <strong className="text-slate-900">{upgradeModal.requiredTier}</strong> tier or above.
                  Your current account tier is <strong className="text-slate-900">{upgradeModal.currentTier}</strong>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Minimum Tier:</span>
                  <TierBadge tier={upgradeModal.requiredTier} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Your Tier:</span>
                  <TierBadge tier={upgradeModal.currentTier} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUpgradeModal(null)}
                  className="w-full sm:w-1/2 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <Link
                  to="/plans"
                  className="w-full sm:w-1/2 py-2.5 text-xs font-bold text-white bg-[#6C4CF1] hover:bg-[#5835ea] rounded-xl text-center shadow-md"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;
