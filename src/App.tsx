import { Toaster } from 'react-hot-toast';
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Modals from './components/Modals';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

// Keep Home static for instant zero-latency landing page render
import Home from './pages/Home';

// Lazy-load secondary and management routes to keep initial bundle tiny and fast
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Donate = lazy(() => import('./pages/Donate'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LibraryLogin = lazy(() => import('./pages/LibraryLogin'));
const LibraryDashboard = lazy(() => import('./pages/LibraryDashboard'));
const VCardLogin = lazy(() => import('./pages/VCardLogin'));
const DigitalSignature = lazy(() => import('./pages/DigitalSignature'));
const POSPlaceholder = lazy(() => import('./pages/POSPlaceholder'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Volunteer = lazy(() => import('./pages/Volunteer'));
const Ambassador = lazy(() => import('./pages/Ambassador'));
const Partner = lazy(() => import('./pages/Partner'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ManagementApp = lazy(() => import('./pages/ManagementApp'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-[#003828]/20 border-t-[#003828] rounded-full animate-spin"></div>
      <span className="text-xs font-medium text-[#003828]/60 tracking-wider uppercase">Loading...</span>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isLoginPage = location.pathname.includes('/login') || location.pathname === '/pos' || location.pathname === '/signature';
  const hideFooter = location.pathname.includes('/login') || location.pathname.includes('/dashboard') || location.pathname.includes('/management');
  
  return (
    <div className={`bg-white min-h-screen selection:bg-[#003828] selection:text-white dark:bg-white dark:text-[#003828] font-sans transition-colors duration-300 ${isLoginPage ? "h-screen overflow-hidden" : ""}`}>
      <Navigation />
      <main className={!isLoginPage ? "pt-[80px]" : "pt-[80px]"}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      <ScrollToTop />
      <Modals />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        {/* <Route path="/election" element={<ElectionPage />} /> */}
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/ambassador" element={<Ambassador />} />
        <Route path="/partner" element={<Partner />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/library/login" element={<LibraryLogin />} />
        <Route path="/library/dashboard" element={<LibraryDashboard />} />
        <Route path="/vcard/login" element={<VCardLogin />} />
        <Route path="/signature" element={<DigitalSignature />} />
        <Route path="/pos" element={<POSPlaceholder />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/management/*" element={<ManagementApp />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Layout>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </Layout>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
