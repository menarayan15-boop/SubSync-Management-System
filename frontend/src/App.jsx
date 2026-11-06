import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import MobileBottomNav from './components/common/MobileBottomNav';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import UserDashboard from './pages/user/UserDashboard';
import PlansPage from './pages/user/PlansPage';
import ResourcesPage from './pages/user/ResourcesPage';
import BillingPage from './pages/user/BillingPage';
import ProfileSettingsPage from './pages/user/ProfileSettingsPage';
import SupportPage from './pages/user/SupportPage';
import NotificationsPage from './pages/user/NotificationsPage';
import VerifyMembershipPage from './pages/public/VerifyMembershipPage';
import RedeemGiftPage from './pages/public/RedeemGiftPage';
import PublicPassportPage from './pages/public/PublicPassportPage';
import AcceptTeamInvitePage from './pages/public/AcceptTeamInvitePage';
import IntelligencePage from './pages/user/IntelligencePage';
import GiftSubscriptionPage from './pages/user/GiftSubscriptionPage';
import SkillPassportPage from './pages/user/SkillPassportPage';
import FamilyTeamPage from './pages/user/FamilyTeamPage';
import TrustCenterPage from './pages/user/TrustCenterPage';
import SubscriptionScannerPage from './pages/user/SubscriptionScannerPage';
import CancellationAssistantPage from './pages/user/CancellationAssistantPage';
import SubscriptionBudgetPage from './pages/user/SubscriptionBudgetPage';
import SubscriptionDiscoveryPage from './pages/user/SubscriptionDiscoveryPage';
import SubSyncRewardsPage from './pages/user/SubSyncRewardsPage';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-brand-500 selection:text-white overflow-x-hidden">
            {/* Ambient Aurora Gradient Lighting */}
            <div className="aurora-canvas" aria-hidden="true">
              <div className="aurora-blob-1" />
              <div className="aurora-blob-2" />
              <div className="aurora-blob-3" />
              <div className="aurora-blob-4" />
            </div>

            <Navbar />
            <main className="flex-1 relative z-10 pb-20 md:pb-0">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/verify-membership" element={<VerifyMembershipPage />} />
                <Route path="/discover" element={<SubscriptionDiscoveryPage />} />
                <Route path="/redeem-gift" element={<RedeemGiftPage />} />
                <Route path="/passport/:idOrMemberId" element={<PublicPassportPage />} />
                <Route path="/team/invite/:token" element={<AcceptTeamInvitePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* User Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/intelligence"
                  element={
                    <ProtectedRoute>
                      <IntelligencePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gift"
                  element={
                    <ProtectedRoute>
                      <GiftSubscriptionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/passport"
                  element={
                    <ProtectedRoute>
                      <SkillPassportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/team"
                  element={
                    <ProtectedRoute>
                      <FamilyTeamPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/trust"
                  element={
                    <ProtectedRoute>
                      <TrustCenterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scanner"
                  element={
                    <ProtectedRoute>
                      <SubscriptionScannerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cancellation"
                  element={
                    <ProtectedRoute>
                      <CancellationAssistantPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/budget"
                  element={
                    <ProtectedRoute>
                      <SubscriptionBudgetPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rewards"
                  element={
                    <ProtectedRoute>
                      <SubSyncRewardsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute>
                      <BillingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <ProfileSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/support"
                  element={
                    <ProtectedRoute>
                      <SupportPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                {/* Fallback Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <MobileBottomNav />
          </div>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
