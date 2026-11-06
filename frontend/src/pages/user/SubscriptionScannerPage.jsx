import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
  Scan,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  X,
  CreditCard,
  FileSearch,
} from 'lucide-react';

const SubscriptionScannerPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeReviewDoc, setActiveReviewDoc] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Form state for review/confirmation
  const [reviewForm, setReviewForm] = useState({
    serviceName: '',
    providerName: '',
    amount: '',
    currency: 'INR',
    billingFrequency: 'monthly',
    category: 'Other',
    startDate: '',
    nextRenewalDate: '',
    notes: '',
  });

  const fileInputRef = useRef(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/scanner/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load scanner dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10MB limit. Please upload a smaller receipt or invoice.');
      return;
    }

    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG document.');
      return;
    }

    setUploadError('');
    setUploading(true);
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await api.post('/api/scanner/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const doc = res.data.document;
        const dup = res.data.duplicateCheck;

        // Populate review form with extracted data
        setReviewForm({
          serviceName: doc.extractedData?.serviceName || '',
          providerName: doc.extractedData?.providerName || '',
          amount: doc.extractedData?.amount || '',
          currency: doc.extractedData?.currency || 'INR',
          billingFrequency: doc.extractedData?.billingFrequency || 'monthly',
          category: doc.extractedData?.category || 'Other',
          startDate: doc.extractedData?.purchaseDate
            ? new Date(doc.extractedData.purchaseDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          nextRenewalDate: doc.extractedData?.nextRenewalDate
            ? new Date(doc.extractedData.nextRenewalDate).toISOString().split('T')[0]
            : '',
          notes: doc.extractedData?.invoiceReference
            ? `Extracted from invoice ref: ${doc.extractedData.invoiceReference}`
            : '',
        });

        setActiveReviewDoc(doc);
        setDuplicateWarning(dup?.isDuplicate ? dup : null);
        fetchDashboard();
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to process document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmAndSave = async (e) => {
    e.preventDefault();
    if (!activeReviewDoc) return;

    if (!reviewForm.serviceName.trim()) {
      alert('Subscription name is required.');
      return;
    }

    if (!reviewForm.amount || isNaN(Number(reviewForm.amount))) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      setSaveLoading(true);
      const res = await api.post(`/api/scanner/confirm/${activeReviewDoc._id}`, reviewForm);
      if (res.data?.success) {
        setSuccessMessage(`Subscription "${reviewForm.serviceName}" has been successfully added to your active subscriptions!`);
        setActiveReviewDoc(null);
        setDuplicateWarning(null);
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save subscription.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scanned document and remove its stored file?')) {
      return;
    }

    try {
      const res = await api.delete(`/api/scanner/document/${id}`);
      if (res.data?.success) {
        if (activeReviewDoc?._id === id) {
          setActiveReviewDoc(null);
          setDuplicateWarning(null);
        }
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  const openDocumentReview = (doc) => {
    setActiveReviewDoc(doc);
    setReviewForm({
      serviceName: doc.extractedData?.serviceName || '',
      providerName: doc.extractedData?.providerName || '',
      amount: doc.extractedData?.amount || '',
      currency: doc.extractedData?.currency || 'INR',
      billingFrequency: doc.extractedData?.billingFrequency || 'monthly',
      category: doc.extractedData?.category || 'Other',
      startDate: doc.extractedData?.purchaseDate
        ? new Date(doc.extractedData.purchaseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      nextRenewalDate: doc.extractedData?.nextRenewalDate
        ? new Date(doc.extractedData.nextRenewalDate).toISOString().split('T')[0]
        : '',
      notes: doc.extractedData?.invoiceReference
        ? `Invoice ref: ${doc.extractedData.invoiceReference}`
        : '',
    });
    setDuplicateWarning(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-2">
              <Scan className="w-3.5 h-3.5" />
              <span>Smart Document Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Subscription Scanner
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Upload invoices, billing receipts, or payment screenshots. SubSync uses optical character recognition (OCR) to extract renewal dates, amounts, and providers automatically.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Document</span>
          </button>
        </div>

        {/* Global Success Notification */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-emerald-500 hover:text-emerald-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scanner Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-violet-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Scanned</span>
              <FileSearch className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {loading ? '...' : dashboardData?.stats?.totalScanned || 0}
            </p>
            <span className="text-xs text-slate-400">Lifetime files processed</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-emerald-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Extractions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {loading ? '...' : dashboardData?.stats?.successfulScans || 0}
            </p>
            <span className="text-xs text-slate-400">OCR successfully parsed</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-amber-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {loading ? '...' : dashboardData?.stats?.pendingReviews || 0}
            </p>
            <span className="text-xs text-slate-400">Awaiting user confirmation</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-rose-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">Failed Scans</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {loading ? '...' : dashboardData?.stats?.failedScans || 0}
            </p>
            <span className="text-xs text-slate-400">Unrecognized or blurry</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">Active Tracked</span>
              <CreditCard className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {loading ? '...' : dashboardData?.stats?.activeTrackedCount || 0}
            </p>
            <span className="text-xs text-slate-400">Subscriptions managed</span>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center ${
            dragActive
              ? 'border-violet-500 bg-violet-50/80 scale-[1.01]'
              : 'border-violet-200 bg-white/80 hover:bg-violet-50/40 hover:border-violet-400'
          } shadow-sm backdrop-blur-md`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
            capture="environment"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-inner">
              {uploading ? (
                <RefreshCw className="w-7 h-7 animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className="text-base font-semibold text-slate-900">
                {uploading
                  ? 'Analyzing document with OCR & extracting data...'
                  : 'Drop your invoice or receipt here, or browse files'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports PDF, JPG, JPEG, and PNG files up to 10MB. Files are stored securely with user-level authorization.
              </p>
            </div>

            {uploading && (
              <div className="w-full bg-violet-100 rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Review & Confirmation Modal / Drawer */}
        {activeReviewDoc && (
          <div className="p-6 lg:p-8 rounded-3xl bg-white border border-violet-100 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">Review & Confirm Extracted Subscription</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                    {activeReviewDoc.extractedData?.confidenceScore || 75}% Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify or edit the OCR-extracted details below before saving. SubSync never creates subscriptions without confirmation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/scanner/document/${activeReviewDoc._id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Original File</span>
                </a>
                <button
                  onClick={() => setActiveReviewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Duplicate Warning Callout */}
            {duplicateWarning && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Possible Duplicate Subscription Detected</span>
                </div>
                <p className="text-xs text-amber-800">
                  {duplicateWarning.duplicateReason}
                </p>
                {duplicateWarning.matchedSubscription && (
                  <div className="text-xs p-2.5 rounded-xl bg-white/70 border border-amber-200 flex flex-wrap gap-4 text-slate-700">
                    <span><strong>Existing Name:</strong> {duplicateWarning.matchedSubscription.name}</span>
                    <span><strong>Amount:</strong> ₹{duplicateWarning.matchedSubscription.amount}</span>
                    <span><strong>Cycle:</strong> {duplicateWarning.matchedSubscription.billingCycle}</span>
                    <span><strong>Status:</strong> {duplicateWarning.matchedSubscription.status}</span>
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleConfirmAndSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Subscription / Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewForm.serviceName}
                    onChange={(e) => setReviewForm({ ...reviewForm, serviceName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium text-slate-900 bg-slate-50/50"
                    placeholder="e.g. Netflix, Spotify, AWS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Provider / Merchant
                  </label>
                  <input
                    type="text"
                    value={reviewForm.providerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, providerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-slate-900 bg-slate-50/50"
                    placeholder="e.g. Netflix Inc."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={reviewForm.category}
                    onChange={(e) => setReviewForm({ ...reviewForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-slate-900 bg-slate-50/50"
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Cloud & Dev">Cloud & Dev</option>
                    <option value="Education">Education</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Business">Business</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Amount Paid (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={reviewForm.amount}
                      onChange={(e) => setReviewForm({ ...reviewForm, amount: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-bold text-slate-900 bg-slate-50/50"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={reviewForm.billingFrequency}
                    onChange={(e) => setReviewForm({ ...reviewForm, billingFrequency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-slate-900 bg-slate-50/50"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={reviewForm.currency}
                    onChange={(e) => setReviewForm({ ...reviewForm, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-slate-900 bg-slate-50/50"
                    placeholder="INR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Purchase / Invoice Date
                  </label>
                  <input
                    type="date"
                    value={reviewForm.startDate}
                    onChange={(e) => setReviewForm({ ...reviewForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-slate-900 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Next Renewal Date
                  </label>
                  <input
                    type="date"
                    value={reviewForm.nextRenewalDate}
                    onChange={(e) => setReviewForm({ ...reviewForm, nextRenewalDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-slate-900 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Notes / Reference ID
                  </label>
                  <input
                    type="text"
                    value={reviewForm.notes}
                    onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-slate-900 bg-slate-50/50"
                    placeholder="e.g. Invoice #12345"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReviewDoc(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Subscription...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Save to Subscriptions</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recently Uploaded Documents Table */}
        <div className="p-6 lg:p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-violet-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recently Uploaded Documents</h2>
              <p className="text-xs text-slate-500">Manage scanned files, re-inspect details, or delete files.</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh table"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
              <span>Loading documents...</span>
            </div>
          ) : !dashboardData?.recentDocuments || dashboardData.recentDocuments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-medium text-slate-600">No documents scanned yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your first subscription invoice or receipt to automatically detect amounts, renewals, and merchant details.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-4">Extracted Service</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">OCR Status</th>
                    <th className="py-3 px-4">Review State</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dashboardData.recentDocuments.map((doc) => {
                    const isPdf = doc.fileMimeType === 'application/pdf';
                    return (
                      <tr key={doc._id} className="hover:bg-violet-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                              {isPdf ? <FileText className="w-4 h-4 text-rose-500" /> : <ImageIcon className="w-4 h-4 text-violet-500" />}
                            </div>
                            <div className="truncate max-w-[180px]">
                              <p className="text-slate-900 text-xs font-semibold truncate">{doc.originalName}</p>
                              <p className="text-slate-400 text-[10px]">{(doc.fileSize / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-900 text-xs font-semibold">
                            {doc.extractedData?.serviceName || '—'}
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            {doc.extractedData?.providerName || ''}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-bold text-xs">
                          {doc.extractedData?.amount ? `₹${doc.extractedData.amount}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              doc.scanStatus === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : doc.scanStatus === 'failed'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {doc.scanStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              doc.reviewStatus === 'confirmed_saved'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {doc.reviewStatus === 'confirmed_saved' ? 'Saved' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {doc.reviewStatus !== 'confirmed_saved' && (
                              <button
                                onClick={() => openDocumentReview(doc)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                              >
                                Review
                              </button>
                            )}
                            <a
                              href={`/api/scanner/document/${doc._id}/file`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="View Document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(doc._id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionScannerPage;

