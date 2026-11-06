import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Compass,
  Search,
  Filter,
  Check,
  Heart,
  Plus,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Scale,
  AlertCircle,
  X,
  CreditCard,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Artificial Intelligence Tools',
  'Entertainment',
  'Productivity',
  'Developer Tools',
  'Design and Creativity',
  'Cloud Storage',
  'Education and Learning',
  'Fitness and Wellness',
];

const SubscriptionDiscoveryPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popularity');
  const [wishlistIds, setWishlistIds] = useState([]);

  // Comparison state (up to 4 services)
  const [comparisonIds, setComparisonIds] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparing, setComparing] = useState(false);

  // Detail Modal
  const [selectedService, setSelectedService] = useState(null);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDetails, setReportDetails] = useState('');
  const [reportType, setReportType] = useState('incorrect_pricing');
  const [reportLoading, setReportLoading] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/discovery/services', {
        params: {
          search,
          category: selectedCategory,
          sortBy,
          limit: 30,
        },
      });
      if (res.data?.success) {
        setServices(res.data.services || []);
      }
    } catch (err) {
      console.error('Failed to load discovery services:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/api/discovery/wishlist');
      if (res.data?.success) {
        const ids = (res.data.wishlist || []).map((item) =>
          typeof item.service === 'object' ? item.service?._id : item.service
        );
        setWishlistIds(ids);
      }
    } catch (err) {
      // User might be guest or unauthenticated
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchServices();
  };

  const toggleWishlist = async (serviceId) => {
    try {
      const res = await api.post('/api/discovery/wishlist/toggle', { serviceId });
      if (res.data?.success) {
        if (res.data.inWishlist) {
          setWishlistIds([...wishlistIds, serviceId]);
        } else {
          setWishlistIds(wishlistIds.filter((id) => id !== serviceId));
        }
      }
    } catch (err) {
      alert('Please log in to save services to your wishlist.');
    }
  };

  const handleTrackService = async (serviceId, planIndex = 0) => {
    try {
      const res = await api.post(`/api/discovery/track/${serviceId}`, { planIndex });
      if (res.data?.success) {
        alert(res.data.message || 'Service added to your active subscriptions!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to track service.');
    }
  };

  const toggleCompare = (serviceId) => {
    if (comparisonIds.includes(serviceId)) {
      setComparisonIds(comparisonIds.filter((id) => id !== serviceId));
    } else {
      if (comparisonIds.length >= 4) {
        alert('You can compare a maximum of 4 services simultaneously.');
        return;
      }
      setComparisonIds([...comparisonIds, serviceId]);
    }
  };

  const openComparisonModal = async () => {
    if (comparisonIds.length === 0) return;
    try {
      setComparing(true);
      const res = await api.post('/api/discovery/compare', { serviceIds: comparisonIds });
      if (res.data?.success) {
        setComparisonData(res.data.comparison || []);
        setShowComparisonModal(true);
      }
    } catch (err) {
      alert('Failed to load comparison data.');
    } finally {
      setComparing(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedService || !reportDetails.trim()) return;
    try {
      setReportLoading(true);
      const res = await api.post('/api/discovery/report', {
        serviceId: selectedService._id,
        reportType,
        details: reportDetails,
      });
      if (res.data?.success) {
        alert(res.data.message);
        setShowReportModal(false);
        setReportDetails('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Subscription Discovery & Market Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Discover Subscriptions
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Explore verified digital tools, compare pricing and features side-by-side, discover handpicked alternatives, and track any service into your dashboard with one click.
            </p>
          </div>

          {comparisonIds.length > 0 && (
            <button
              onClick={openComparisonModal}
              disabled={comparing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200 transition-all cursor-pointer animate-pulse"
            >
              <Scale className="w-4 h-4" />
              <span>Compare ({comparisonIds.length}/4 Selected)</span>
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools, platforms, AI services (e.g. Netflix, ChatGPT, GitHub)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50/50"
              />
            </form>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="popularity">Sort: Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-violet-500" />
            <span>Loading verified services...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
            <Compass className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No services found</p>
            <p className="text-xs text-slate-400">Try modifying your search query or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => {
              const isWishlisted = wishlistIds.includes(svc._id);
              const isComparing = comparisonIds.includes(svc._id);
              const minPrice = svc.plans?.length > 0 ? Math.min(...svc.plans.map((p) => p.price)) : 0;
              const hasFree = svc.plans?.some((p) => p.price === 0 || p.billingFrequency === 'free');

              return (
                <div
                  key={svc._id}
                  className="p-6 rounded-3xl bg-white border border-violet-100 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                          {svc.category}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5">{svc.name}</h3>
                      </div>
                      <button
                        onClick={() => toggleWishlist(svc._id)}
                        className={`p-2 rounded-xl transition-colors ${
                          isWishlisted
                            ? 'text-rose-500 bg-rose-50'
                            : 'text-slate-300 hover:text-rose-400 hover:bg-slate-50'
                        }`}
                        title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{svc.shortDescription}</p>

                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-lg font-extrabold text-slate-900">
                        {hasFree && minPrice === 0 ? 'Free tier' : `From ₹${minPrice}`}
                      </span>
                      {minPrice > 0 && <span className="text-xs text-slate-400">/ mo</span>}
                    </div>

                    {/* Features pill preview */}
                    <div className="flex flex-wrap gap-1.5">
                      {svc.plans?.[0]?.features?.slice(0, 2).map((feat, fIdx) => (
                        <span
                          key={fIdx}
                          className="text-[10px] text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg truncate max-w-[200px]"
                        >
                          ✓ {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
                        <input
                          type="checkbox"
                          checked={isComparing}
                          onChange={() => toggleCompare(svc._id)}
                          className="rounded text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-[11px]">Compare</span>
                      </label>

                      <button
                        onClick={() => setSelectedService(svc)}
                        className="text-violet-600 hover:text-violet-700 font-semibold text-xs flex items-center gap-0.5"
                      >
                        <span>Details & Plans</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleTrackService(svc._id)}
                        className="w-full py-1.5 px-3 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </button>

                      <a
                        href={svc.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 px-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Official Site</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Service Details & Alternatives Modal */}
        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                    {selectedService.category}
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedService.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verified on {new Date(selectedService.lastVerifiedDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedService(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-slate-600">{selectedService.fullDescription || selectedService.shortDescription}</p>

              {/* Plans Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Available Subscription Tiers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedService.plans?.map((plan, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-violet-50/40 border border-violet-100 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-bold text-slate-900">{plan.name}</span>
                          <span className="text-base font-extrabold text-violet-700">
                            {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                          </span>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1 mt-2">
                          {plan.features?.map((f, fIdx) => (
                            <li key={fIdx}>✓ {f}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => handleTrackService(selectedService._id, idx)}
                        className="w-full mt-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
                      >
                        Track This Tier
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Curated Alternatives */}
              {selectedService.alternatives && selectedService.alternatives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Recommended Alternatives</h4>
                  <div className="space-y-2">
                    {selectedService.alternatives.map((alt, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-bold text-slate-900">{alt.serviceName}: </span>
                        <span className="text-slate-600">{alt.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Report incorrect pricing or details
                </button>

                <a
                  href={selectedService.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 flex items-center gap-1.5"
                >
                  <span>Open Official Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Modal */}
        {showComparisonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-violet-600" />
                  <h3 className="text-xl font-bold text-slate-900">Side-by-Side Comparison</h3>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold text-slate-500 uppercase">Service</th>
                      {comparisonData.map((svc) => (
                        <th key={svc._id} className="p-3 font-bold text-slate-900 text-sm">
                          {svc.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-500">Starting Price</td>
                      {comparisonData.map((svc) => (
                        <td key={svc._id} className="p-3 font-bold text-violet-700">
                          ₹{svc.plans?.[0]?.price || 0} / {svc.plans?.[0]?.billingFrequency || 'mo'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-500">Category</td>
                      {comparisonData.map((svc) => (
                        <td key={svc._id} className="p-3 text-slate-700">
                          {svc.category}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-500">Free Trial</td>
                      {comparisonData.map((svc) => (
                        <td key={svc._id} className="p-3 text-slate-700">
                          {svc.plans?.some((p) => p.hasFreeTrial)
                            ? `Yes (${svc.plans.find((p) => p.hasFreeTrial)?.freeTrialDays} days)`
                            : 'No free trial'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-500">Platforms</td>
                      {comparisonData.map((svc) => (
                        <td key={svc._id} className="p-3 text-slate-700">
                          {svc.supportedPlatforms?.join(', ') || 'Web'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-500">Official Link</td>
                      {comparisonData.map((svc) => (
                        <td key={svc._id} className="p-3">
                          <a
                            href={svc.officialWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1"
                          >
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Report Discrepancy Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Report Pricing Discrepancy</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Issue Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="incorrect_pricing">Incorrect Pricing</option>
                    <option value="broken_link">Broken Official Link</option>
                    <option value="outdated_features">Outdated Features</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Details
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe the discrepancy (e.g. Netflix Premium increased from ₹649 to ₹699)..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportLoading}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700"
                  >
                    {reportLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionDiscoveryPage;

