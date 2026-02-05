/**
 * Army Recruiter Tool - Client Application
 * 
 * Copyright © 2025 Alex Moran. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { VerificationWarning } from "@/components/verification-warning";

// Auth pages
import RegisterPage from "@/pages/register";
import LoginPage from "@/pages/login";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import VerifyEmailPage from "@/pages/verify-email";

// Protected pages
import Dashboard from "@/pages/dashboard";
import MyQRCode from "@/pages/my-qr";
import IntakeForm from "@/pages/intake-form";
import RecruitDetail from "@/pages/recruit-detail";
import ProspectingMap from "@/pages/prospecting-map";
import AdminRequests from "@/pages/admin-requests";
import StationCommanderDashboard from "@/pages/station-commander-dashboard";
import ShippersPage from "@/pages/shippers";

// Public pages
import ApplyPage from "@/pages/apply";
import SurveyPage from "@/pages/survey";
import NotFound from "@/pages/not-found";
import ProfilePage from "@/pages/profile";
import ApprovalSuccess from "@/pages/approval-success";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/register" component={RegisterPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/apply" component={ApplyPage} />
      <Route path="/survey" component={SurveyPage} />
      <Route path="/approval-success" component={ApprovalSuccess} />
      
      {/* Protected routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/my-qr" component={MyQRCode} />
      <Route path="/prospecting" component={ProspectingMap} />
      <Route path="/intake" component={IntakeForm} />
      <Route path="/intake-form" component={IntakeForm} />
      <Route path="/recruits/:id" component={RecruitDetail} />
      
      {/* Admin routes */}
      <Route path="/admin/requests" component={AdminRequests} />
      
      {/* Station Commander routes */}
      <Route path="/station-commander" component={StationCommanderDashboard} />
      <Route path="/shippers" component={ShippersPage} />
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  
  // Pages with their own full layout (no header/footer)
  // Only public/auth pages - all protected routes use global header
  const noLayoutPages = [
    "/register",
    "/login",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/apply",
    "/approval-success",
  ];
  
  const showLayout = !noLayoutPages.some(page => location.startsWith(page));

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-army-green flex flex-col">
        {showLayout && <Header />}
        {showLayout && <VerificationWarning />}
        <div className="flex-1">
          <Router />
        </div>
        {showLayout && <Footer />}
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
