import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
  ShieldAlert,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  FileCheck,
  Upload,
  Eye,
  Trash2,
  ChevronRight,
  Info,
  ArrowRight,
  X,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

const CancellationAssistantPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [availableSubs, setAvailableSubs] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);

  // New workflow modal state
  const [newWorkflowData, setNewWorkflowData] = useState({
    serviceName: '',
    trackedSubscriptionId: '',
    guideId: '',
    amount: '',
    currency: 'INR',
    renewalDate: '',
    userNotes: '',
  });

  const evidenceInputRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfRes, guidesRes] = await Promise.all([
        api.get('/api/cancellation/workflows'),
        api.get('/api/cancellation/guides'),
      ]);

      if (wfRes.data?.success) {
        setWorkflows(wfRes.data.workflows || []);
        setAvailableSubs(wfRes.data.availableSubscriptions || []);
      }
      if (guidesRes.data?.success) {
        setGuides(guidesRes.data.guides || []);
      }
    } catch (err) {
      console.error('Failed to load cancellation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartWorkflow = async (e) => {
    e.preventDefault();
    if (!newWorkflowData.serviceName.trim()) {
      alert('Service name is required.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post('/api/cancellation/start', newWorkflowData);
      if (res.data?.success) {
        setShowStartModal(false);
        setNewWorkflowData({
          serviceName: '',
          trackedSubscriptionId: '',
          guideId: '',
          amount: '',
          currency: 'INR',
          renewalDate: '',
          userNotes: '',
        });
        await fetchData();
        setSelectedWorkflow(res.data.workflow);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start cancellation workflow.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (workflowId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/api/cancellation/${workflowId}/status`, {
        status: newStatus,
        note: statusNote,
      });

      if (res.data?.success) {
        setStatusNote('');
        setSelectedWorkflow(res.data.workflow);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEvidenceUpload = async (file) => {
    if (!file || !selectedWorkflow) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('evidence', file);

    try {
      setUploadingEvidence(true);
      const res = await api.post(`/api/cancellation/${selectedWorkflow._id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setSelectedWorkflow(res.data.workflow);
        fetchData();
        alert('Cancellation evidence uploaded and verified!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload evidence.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!window.confirm('Delete this cancellation workflow?')) return;
    try {
      const res = await api.delete(`/api/cancellation/${id}`);
      if (res.data?.success) {
        if (selectedWorkflow?._id === id) setSelectedWorkflow(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete workflow.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Cancelled':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancellation Requested':
      case 'Awaiting Confirmation':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancellation Failed':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Instructions Viewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const calculateDaysRemaining = (renewalDate) => {
    if (!renewalDate) return null;
    const diffTime = new Date(renewalDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Smart Cancellation Assistant</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Subscription Cancellation Hub
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Get official step-by-step instructions, direct cancellation links, renewal warnings, and track your cancellation requests safely.
            </p>
          </div>
          <button
            onClick={() => setShowStartModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200 transition-all cursor-pointer"
          >
            <span>Cancel a Subscription</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Launch Cards from Tracked Subscriptions */}
        {availableSubs.length > 0 && (
          <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-md border border-violet-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-600" />
              <span>Your Active Subscriptions Available for Cancellation</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {availableSubs.slice(0, 4).map((sub) => {
                const days = calculateDaysRemaining(sub.nextRenewalDate);
                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-violet-50/40 border border-violet-100 hover:border-violet-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-sm truncate">{sub.name}</p>
                      <p className="text-xs text-slate-500">₹{sub.amount} / {sub.billingCycle}</p>
                      {days !== null && (
                        <p className={`text-[11px] font-semibold mt-1.5 ${days <= 3 ? 'text-rose-600' : 'text-slate-500'}`}>
                          Renews in {days > 0 ? `${days} day${days > 1 ? 's' : ''}` : 'Today'}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setNewWorkflowData({
                          serviceName: sub.name,
                          trackedSubscriptionId: sub.id,
                          guideId: '',
                          amount: sub.amount,
                          currency: sub.currency || 'INR',
                          renewalDate: sub.nextRenewalDate ? new Date(sub.nextRenewalDate).toISOString().split('T')[0] : '',
                          userNotes: '',
                        });
                        setShowStartModal(true);
                      }}
                      className="mt-3 w-full py-1.5 px-3 rounded-xl bg-white text-xs font-semibold text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white transition-all text-center"
                    >
                      Start Cancellation
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Layout: Active Workflows List + Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workflows List (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500">Active Workflows ({workflows.length})</span>
              <button
                onClick={fetchData}
                className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />
                <span>Loading workflows...</span>
              </div>
            ) : workflows.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-slate-200/80 text-center space-y-3">
                <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No cancellation requests</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click "Cancel a Subscription" above to choose a service and receive step-by-step guidance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map((wf) => {
                  const isSelected = selectedWorkflow?._id === wf._id;
                  const days = calculateDaysRemaining(wf.renewalDate);

                  return (
                    <div
                      key={wf._id}
                      onClick={() => setSelectedWorkflow(wf)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-50/70 border-violet-400 shadow-sm scale-[1.01]'
                          : 'bg-white border-slate-200/80 hover:border-violet-200 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{wf.serviceName}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {wf.amount > 0 ? `₹${wf.amount} • ` : ''}
                            {days !== null ? (
                              <span className={days <= 3 ? 'text-rose-600 font-semibold' : ''}>
                                Renews in {days}d
                              </span>
                            ) : (
                              'No renewal date'
                            )}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(
                            wf.status
                          )}`}
                        >
                          {wf.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workflow Detail & Guidance Panel (Right 7 Cols) */}
          <div className="lg:col-span-7">
            {!selectedWorkflow ? (
              <div className="p-12 rounded-3xl bg-white/70 border border-violet-100 shadow-sm text-center text-slate-400 space-y-2">
                <Info className="w-10 h-10 text-violet-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Select a cancellation workflow</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click on any subscription on the left to view official cancellation instructions, warnings, and evidence status.
                </p>
              </div>
            ) : (
              <div className="p-6 lg:p-8 rounded-3xl bg-white border border-violet-100 shadow-sm space-y-6">
                {/* Panel Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedWorkflow.serviceName}</h2>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(selectedWorkflow.status)}`}>
                        {selectedWorkflow.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Workflow started on {new Date(selectedWorkflow.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedWorkflow.officialCancelUrl && (
                      <a
                        href={selectedWorkflow.officialCancelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-sm"
                      >
                        <span>Official Cancel Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteWorkflow(selectedWorkflow._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Account Settings Path */}
                {selectedWorkflow.accountSettingsPath && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 flex items-start gap-2">
                    <span className="font-semibold text-slate-900 shrink-0">Settings Path:</span>
                    <span className="font-mono text-violet-700">{selectedWorkflow.accountSettingsPath}</span>
                  </div>
                )}

                {/* Important Warnings */}
                {selectedWorkflow.warnings && selectedWorkflow.warnings.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Important Provider Notices</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                      {selectedWorkflow.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step-by-Step Instructions */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Verified Step-by-Step Instructions</h3>
                  <div className="space-y-2">
                    {selectedWorkflow.stepByStepGuide.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="mt-0.5">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Progression Controls */}
                <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Update Cancellation Progress</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Instructions Viewed', 'Cancellation Requested', 'Awaiting Confirmation', 'Cancelled', 'Cancellation Failed'].map(
                      (st) => (
                        <button
                          key={st}
                          disabled={actionLoading || selectedWorkflow.status === st}
                          onClick={() => handleUpdateStatus(selectedWorkflow._id, st)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            selectedWorkflow.status === st
                              ? 'bg-violet-600 text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-violet-300'
                          }`}
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Cancellation Evidence Upload */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Cancellation Proof & Evidence</h4>
                      <p className="text-[11px] text-slate-500">Upload screenshot of cancellation confirmation or email.</p>
                    </div>
                    <button
                      onClick={() => evidenceInputRef.current?.click()}
                      disabled={uploadingEvidence}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingEvidence ? 'Uploading...' : 'Upload Evidence'}</span>
                    </button>
                    <input
                      ref={evidenceInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleEvidenceUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  {selectedWorkflow.evidence?.fileName && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{selectedWorkflow.evidence.originalName}</span>
                      </div>
                      <a
                        href={`/api/cancellation/${selectedWorkflow._id}/evidence-file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* History Timeline */}
                {selectedWorkflow.history && selectedWorkflow.history.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">History & Timeline</h4>
                    <div className="space-y-1.5 border-l-2 border-violet-100 pl-3">
                      {selectedWorkflow.history.map((h, idx) => (
                        <div key={idx} className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">{h.status}</span>
                          <span className="text-slate-400 text-[10px] ml-2">
                            {new Date(h.timestamp).toLocaleDateString()}
                          </span>
                          {h.note && <p className="text-slate-500 text-[11px] mt-0.5">{h.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Start New Cancellation Workflow */}
        {showStartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-lg w-full shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Start Cancellation Assistant</h3>
                <button
                  onClick={() => setShowStartModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStartWorkflow} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Select Verified Service or Type Name *
                  </label>
                  <select
                    value={newWorkflowData.guideId}
                    onChange={(e) => {
                      const selGuide = guides.find((g) => g.id === e.target.value);
                      setNewWorkflowData({
                        ...newWorkflowData,
                        guideId: e.target.value,
                        serviceName: selGuide ? selGuide.name : newWorkflowData.serviceName,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50/50 mb-2"
                  >
                    <option value="">-- Choose from Verified Guide Catalog --</option>
                    {guides.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.category})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    value={newWorkflowData.serviceName}
                    onChange={(e) => setNewWorkflowData({ ...newWorkflowData, serviceName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900"
                    placeholder="Or enter custom service name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={newWorkflowData.amount}
                      onChange={(e) => setNewWorkflowData({ ...newWorkflowData, amount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      placeholder="e.g. 649"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Next Renewal Date
                    </label>
                    <input
                      type="date"
                      value={newWorkflowData.renewalDate}
                      onChange={(e) => setNewWorkflowData({ ...newWorkflowData, renewalDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowStartModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-200 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? 'Starting...' : 'Start Workflow'}
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

export default CancellationAssistantPage;

