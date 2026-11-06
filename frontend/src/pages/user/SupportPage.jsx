import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/Badge';
import {
  HelpCircle,
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  Shield,
  User,
} from 'lucide-react';

const SupportPage = () => {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // New Ticket Form State
  const [isCreating, setIsCreating] = useState(false);
  const [category, setCategory] = useState('Billing & Invoicing');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [createLoading, setCreateLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const categories = [
    'Billing & Invoicing',
    'Subscription Upgrade/Downgrade',
    'Resource Access',
    'Account Security',
    'Technical Support',
    'Other',
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/support/my-tickets');
      if (res.data.success) {
        setTickets(res.data.tickets);
        if (res.data.tickets.length > 0 && !activeTicket) {
          setActiveTicket(res.data.tickets[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setAlert(null);

      const res = await api.post('/support', {
        category,
        subject,
        description,
        priority,
      });

      if (res.data.success) {
        setAlert({
          type: 'success',
          text: 'Ticket created successfully! Our team will respond shortly.',
        });
        setIsCreating(false);
        setSubject('');
        setDescription('');
        await fetchTickets();
        setActiveTicket(res.data.ticket);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit ticket.',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    try {
      setReplyLoading(true);
      const res = await api.post(`/support/${activeTicket._id}/reply`, {
        message: replyMessage,
      });

      if (res.data.success) {
        setActiveTicket(res.data.ticket);
        setReplyMessage('');
        // Update in list
        setTickets((prev) =>
          prev.map((t) => (t._id === res.data.ticket._id ? res.data.ticket : t))
        );
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Support & Help Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit inquiry tickets, track resolution status, and chat directly with SubSync administrators.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-navy-900 hover:bg-navy-800 text-white shadow-soft transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'View Tickets' : 'New Support Ticket'}</span>
        </button>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-soft ${
            alert.type === 'success'
              ? 'bg-teal-50 text-teal-800 border border-teal-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alert.text}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* New Ticket Form Modal/Drawer */}
      {isCreating ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-brand-50 rounded-xl text-brand-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900">Open a New Support Ticket</h2>
              <p className="text-xs text-slate-500">Provide details so our desk can assist promptly</p>
            </div>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="low">Low - General Question</option>
                  <option value="medium">Medium - Standard Request</option>
                  <option value="high">High - Quota / Payment Issue</option>
                  <option value="urgent">Urgent - Service Disruption</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your question or issue"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe your problem or question in detail..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow-soft transition-all"
              >
                {createLoading ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Two Column Layout: Tickets List on Left, Active Ticket Thread on Right */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Tickets List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-5 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-bold text-navy-900">Your Tickets ({tickets.length})</h2>
              <span className="text-[11px] text-slate-400">Click to inspect</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <p>You have not submitted any tickets yet.</p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="text-brand-600 font-semibold hover:underline"
                  >
                    Create your first ticket
                  </button>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    onClick={() => setActiveTicket(ticket)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      activeTicket?._id === ticket._id
                        ? 'bg-brand-50/50 border-brand-300 ring-2 ring-brand-500/10'
                        : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-mono text-[10px] text-slate-500 font-bold">
                        {ticket.ticketNumber}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <h3 className="text-xs font-bold text-navy-900 line-clamp-1">{ticket.subject}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{ticket.category}</p>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      <span>{ticket.responses?.length || 1} messages</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Active Ticket Thread */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-soft flex flex-col justify-between min-h-[550px] overflow-hidden">
            {activeTicket ? (
              <>
                {/* Thread Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {activeTicket.ticketNumber}
                        </span>
                        <StatusBadge status={activeTicket.status} />
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold uppercase">
                          {activeTicket.priority}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-navy-900 mt-2">{activeTicket.subject}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Category: {activeTicket.category}</p>
                    </div>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[400px]">
                  {activeTicket.responses?.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        msg.isAdmin ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-1">
                        {msg.isAdmin ? (
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-brand-600" />
                        )}
                        <span className="font-semibold text-slate-700">
                          {msg.isAdmin ? 'SubSync Admin Team' : msg.userName || 'You'}
                        </span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${
                          msg.isAdmin
                            ? 'bg-amber-50/80 border border-amber-200 text-amber-950 rounded-tl-sm'
                            : 'bg-navy-900 text-white rounded-tr-sm shadow-soft'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input Box */}
                {activeTicket.status !== 'Closed' ? (
                  <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your response to the support team..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={replyLoading || !replyMessage.trim()}
                        className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-soft transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-500">
                    This ticket has been marked as Closed. Open a new ticket if you require further assistance.
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs my-auto">
                Select a ticket from the left column to view message replies.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
