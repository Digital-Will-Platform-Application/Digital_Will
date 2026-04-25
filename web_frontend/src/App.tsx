import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import SuperAdminProtectedRoute from "@/components/SuperAdminProtectedRoute";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import Payment from "./pages/Payment";
import LearnMore from "./pages/LearnMore";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import CreateWill from "./pages/CreateWill";
import CreateAudioWill from "./pages/CreateAudioWill";
import CreateVideoWill from "./pages/CreateVideoWill";
import CreateManualWill from "./pages/CreateManualWill";
import CreateNoteWill from "./pages/CreateNoteWill";
import AssetManagement from "./pages/AssetManagement";
import Recipients from "./pages/Recipients";
import ReviewWill from "./pages/ReviewWill";
import WillDetail from "./pages/WillDetail";
import Confirmation from "./pages/Confirmation";
import Reminders from "./pages/Reminders";
import Account from "./pages/Account";
import WillManagement from "./pages/WillManagement";
import OnboardingAssetSelection from "./pages/OnboardingAssetSelection";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyRecipient from "./pages/VerifyRecipient";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";
import AdminLayout, { AdminDashboardContent } from "./pages/AdminDashboard";
import AdminAccount from "./pages/AdminAccount";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminAnalyticsReports from "./pages/AdminAnalyticsReports";
import AdminSettings from "./pages/AdminSettings";
import UserLayout from "./components/layout/UserLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/learn-more" element={<LearnMore />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-recipient" element={<VerifyRecipient />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
              <Route path="onboarding" element={<OnboardingAssetSelection />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="wills" element={<WillManagement />} />
              <Route path="create" element={<CreateWill />} />
              <Route path="create/chat" element={<Navigate to="/create" replace />} />
              <Route path="create/audio" element={<CreateAudioWill />} />
              <Route path="create/video" element={<CreateVideoWill />} />
              <Route path="create/manual" element={<CreateManualWill />} />
              <Route path="create/note" element={<CreateNoteWill />} />
              <Route path="assets" element={<AssetManagement />} />
              <Route path="recipients" element={<Recipients />} />
              <Route path="review" element={<ReviewWill />} />
              <Route path="will/:id" element={<WillDetail />} />
              <Route path="confirmation" element={<Confirmation />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="account" element={<Account />} />
            </Route>
            <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
              <Route index element={<AdminDashboardContent />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="analytics" element={<AdminAnalyticsReports />} />
              <Route path="account" element={<AdminAccount />} />
              <Route
                path="settings"
                element={
                  <SuperAdminProtectedRoute>
                    <AdminSettings />
                  </SuperAdminProtectedRoute>
                }
              />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
