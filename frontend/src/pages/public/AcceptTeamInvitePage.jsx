import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const AcceptTeamInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchInvitePreview();
  }, [token]);

  const fetchInvitePreview = async () => {
    try {
      setLoading(true);
      setAlert(null);
      const res = await api.get(`/team/invite/${token}`);
      if (res.data?.success) {
        setInvitation(res.data.invitation);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Invitation is invalid, expired, or has already been used.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      navigate(`/login?redirect=/team/invite/${token}`);
      return;
    }

    try {
      setAccepting(true);
      setAlert(null);
      const res = await api.post('/team/accept-invite', { token });
      if (res.data?.success) {
        setSuccessMsg(res.data.message);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to accept invitation.',
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center text-[#6C4CF1] animate-spin mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-[#172033]">Verifying Team Invitation...</h3>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 sm:py-20 text-[#172033] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shadow-lg mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">Team Invitation</h1>
          <p className="text-xs text-slate-500 mt-1">
            You have been invited to collaborate under a SubSync shared membership group.
          </p>
        </div>

        {alert && (
          <div className="mb-6 p-4 rounded-2xl text-xs bg-rose-50 text-rose-800 border border-rose-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{alert.text}</span>
          </div>
        )}

        {successMsg ? (
          <div className="liquid-glass rounded-3xl border border-emerald-200 shadow-glass p-8 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#172033]">Welcome to the Team! 🎉</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{successMsg}</p>
            <div className="pt-4 flex items-center justify-center space-x-3">
              <Link
                to="/team"
                className="px-6 py-3 rounded-xl text-xs font-bold liquid-button shadow-md flex items-center space-x-1.5"
              >
                <span>View Team Group</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          invitation && (
            <div className="liquid-glass rounded-3xl border border-white/90 shadow-glass p-6 sm:p-8 space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Group Name:</span>
                  <span className="font-bold text-[#172033]">{invitation.groupName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Invited By:</span>
                  <span className="font-bold text-slate-700">{invitation.ownerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Subscription Tier:</span>
                  <span className="font-bold text-[#6C4CF1]">{invitation.planName} Tier</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Assigned Role:</span>
                  <span className="font-bold text-emerald-600 capitalize">{invitation.role}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-3.5 rounded-xl text-xs font-bold liquid-button shadow-md flex items-center justify-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>
                  {accepting
                    ? 'Joining Group...'
                    : user
                    ? 'Accept Invitation & Join Team'
                    : 'Sign In to Accept Invitation'}
                </span>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AcceptTeamInvitePage;

