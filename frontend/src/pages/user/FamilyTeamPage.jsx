import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Mail,
  Crown,
} from 'lucide-react';

const FamilyTeamPage = () => {
  const { user } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [submitting, setSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/team/my-group');
      if (res.data?.success) {
        setTeamData(res.data);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      setSubmitting(true);
      setAlert(null);
      const res = await api.post('/team/create', { name: groupName.trim() });
      if (res.data?.success) {
        setCreateModalOpen(false);
        setGroupName('');
        await fetchTeamData();
        setAlert({ type: 'success', text: res.data.message });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create group.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setSubmitting(true);
      setAlert(null);
      const res = await api.post('/team/invite', {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      if (res.data?.success) {
        setGeneratedInviteLink(res.data.inviteLink);
        setInviteEmail('');
        await fetchTeamData();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send invitation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) return;
    try {
      const res = await api.delete(`/team/members/${memberUserId}`);
      if (res.data?.success) {
        setAlert({ type: 'success', text: 'Member removed successfully.' });
        await fetchTeamData();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove member.',
      });
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    try {
      const res = await api.delete(`/team/invites/${inviteId}`);
      if (res.data?.success) {
        setAlert({ type: 'success', text: 'Invitation revoked.' });
        await fetchTeamData();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to revoke invitation.',
      });
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedToken(link);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center text-[#6C4CF1] animate-spin mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-[#172033]">Checking Team Group & Seats...</h3>
      </div>
    );
  }

  const { hasGroup, isOwner, userRole, group, isEligibleToCreate, eligibleSeats, currentPlanName } =
    teamData || {};

  return (
    <div className="min-h-screen py-8 sm:py-12 text-[#172033]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* HERO BANNER */}
        <div className="p-6 sm:p-8 liquid-glass rounded-3xl border border-white/80 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-400/10 via-violet-400/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shadow-md shrink-0">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C4CF1] bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200">
                Multi-User Sharing
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#172033] mt-1 tracking-tight">
                Family & Team Membership
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Share full subscription benefits, manage team permissions, and monitor shared download quotas.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center space-x-2 self-start md:self-auto">
            {hasGroup && (isOwner || userRole === 'admin') && group.availableSeats > 0 && (
              <button
                onClick={() => {
                  setGeneratedInviteLink('');
                  setInviteModalOpen(true);
                }}
                className="touch-target px-4 py-2.5 liquid-button text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite New Member</span>
              </button>
            )}

            {!hasGroup && isEligibleToCreate && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="touch-target px-5 py-2.5 liquid-button text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Establish Group ({eligibleSeats} Seats)</span>
              </button>
            )}
          </div>
        </div>

        {/* ALERT */}
        {alert && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
              alert.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {alert.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              <span>{alert.text}</span>
            </div>
            <button onClick={() => setAlert(null)} className="font-bold">×</button>
          </div>
        )}

        {/* NOT IN A GROUP */}
        {!hasGroup && (
          <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-violet-100 text-[#6C4CF1] flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>

            <div className="max-w-lg mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#172033]">
                {isEligibleToCreate ? 'You Have Unclaimed Seats Available!' : 'Upgrade to Unlock Team Sharing'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isEligibleToCreate
                  ? `Your current ${currentPlanName} subscription includes up to ${eligibleSeats} seats for family and teammates at no extra charge.`
                  : 'Family & Team sharing is exclusively available on Silver (2 seats) and Gold (4 seats) tiers. Upgrade now to invite collaborators.'}
              </p>
            </div>

            {isEligibleToCreate ? (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-6 py-3 liquid-button text-xs font-bold rounded-xl shadow-md inline-flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Your Family & Team Group Now</span>
              </button>
            ) : (
              <Link
                to="/plans"
                className="px-6 py-3 liquid-button text-xs font-bold rounded-xl shadow-md inline-flex items-center space-x-2"
              >
                <span>Upgrade to Silver or Gold Tier</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {/* ACTIVE GROUP DASHBOARD */}
        {hasGroup && group && (
          <>
            {/* SEAT METRICS GAUGE */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bento-card p-5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Group Seats</span>
                <p className="text-3xl font-black text-[#172033] mt-1">{group.seatLimit}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{group.plan?.name} Tier Allocation</p>
              </div>

              <div className="bento-card p-5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Active Members</span>
                <p className="text-3xl font-black text-[#6C4CF1] mt-1">
                  {group.activeMembersCount} <span className="text-sm font-normal text-slate-400">/ {group.seatLimit}</span>
                </p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#6C4CF1] h-1.5 rounded-full"
                    style={{ width: `${(group.activeMembersCount / group.seatLimit) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bento-card p-5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Available Seats</span>
                <p className="text-3xl font-black text-emerald-600 mt-1">{group.availableSeats}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Ready for invitations</p>
              </div>

              <div className="bento-card p-5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Your Group Role</span>
                <p className="text-2xl font-black text-[#172033] mt-1 capitalize">{userRole}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{isOwner ? 'Full administrative rights' : 'Member permissions'}</p>
              </div>
            </div>

            {/* MEMBERS ROSTER */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-[#172033]">{group.name} — Members Roster</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Active users sharing this subscription</p>
                </div>
                <span className="text-xs font-bold text-[#6C4CF1] bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                  {group.members?.length} Members
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Member</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Joined Date</th>
                      <th className="py-3 px-3">Status</th>
                      {(isOwner || userRole === 'admin') && <th className="py-3 px-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.members?.map((m) => {
                      const u = m.user || {};
                      const isSelf = u._id === user?._id;
                      const isGroupOwner = m.role === 'owner';
                      return (
                        <tr key={m._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-3 flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-violet-100 text-[#6C4CF1] font-bold flex items-center justify-center text-xs">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-[#172033]">
                                {u.name} {isSelf && <span className="text-slate-400 text-[10px]">(You)</span>}
                              </p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                isGroupOwner
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : m.role === 'admin'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isGroupOwner && <Crown className="w-3 h-3 text-amber-500 mr-1" />}
                              <span>{m.role}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-500">
                            {new Date(m.joinedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          </td>
                          {(isOwner || userRole === 'admin') && (
                            <td className="py-3.5 px-3 text-right">
                              {!isGroupOwner && !isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(u._id)}
                                  className="text-rose-600 hover:text-rose-800 font-bold p-1 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Remove member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PENDING INVITATIONS TABLE (Visible to Owner/Admin) */}
            {(isOwner || userRole === 'admin') && group.invitations?.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
                <h3 className="text-base font-black text-[#172033]">Pending Invitations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Recipient Email</th>
                        <th className="py-2.5 px-3">Invited Role</th>
                        <th className="py-2.5 px-3">Expires At</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.invitations
                        .filter((i) => i.status === 'pending')
                        .map((inv) => {
                          const link = `${window.location.origin}/team/invite/${inv.token}`;
                          return (
                            <tr key={inv._id}>
                              <td className="py-3 px-3 font-semibold text-slate-800">{inv.email}</td>
                              <td className="py-3 px-3 capitalize">{inv.role}</td>
                              <td className="py-3 px-3 text-slate-500">
                                {new Date(inv.expiresAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-3 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(link)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#6C4CF1] hover:text-white font-bold text-[11px] transition-all"
                                >
                                  {copiedToken === link ? 'Copied' : 'Copy Link'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeInvite(inv._id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] transition-all"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-black text-lg text-[#172033] mb-1">Create Family & Team Group</h3>
            <p className="text-xs text-slate-500 mb-4">
              Give your group a recognizable name for teammates and family members.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Apex Engineering Lab / Priyadarshi Family"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C4CF1] outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold liquid-button shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-black text-lg text-[#172033] mb-1">Invite Team Member</h3>
            <p className="text-xs text-slate-500 mb-4">
              Send a secure time-limited invitation token to your teammate.
            </p>

            {generatedInviteLink ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                  Invitation link successfully generated!
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 truncate select-all">
                  {generatedInviteLink}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedInviteLink)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#6C4CF1] text-white shadow-sm flex items-center space-x-1"
                  >
                    {copiedToken === generatedInviteLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken === generatedInviteLink ? 'Copied!' : 'Copy Invitation Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Teammate Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C4CF1] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C4CF1] outline-none bg-white"
                  >
                    <option value="member">Member (Access shared downloads & vault)</option>
                    <option value="admin">Admin (Can also invite other members)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !inviteEmail.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold liquid-button shadow-sm"
                  >
                    {submitting ? 'Generating...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTeamPage;

