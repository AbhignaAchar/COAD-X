import React, { useState } from 'react';
import { ForensicProvider } from './context/ForensicContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationToast from './components/NotificationToast';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EvidenceUpload from './pages/EvidenceUpload';
import FragmentScanner from './pages/FragmentScanner';
import FileClassification from './pages/FileClassification';
import EvidenceGraph from './pages/EvidenceGraph';
import FileReconstruction from './pages/FileReconstruction';
import IntegrityChecker from './pages/IntegrityChecker';
import AiCopilot from './pages/AiCopilot';
import TamperDetection from './pages/TamperDetection';
import ToolkitPriority from './pages/ToolkitPriority';
import PdfReports from './pages/PdfReports';

import ErrorBoundary from './components/ErrorBoundary';
import SupabaseAuthModal from './components/SupabaseAuthModal';

function AppContent() {
  const { isAuthenticated, isAuthModalOpen, closeAuthModal } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'upload':
        return <EvidenceUpload />;
      case 'scanner':
        return <FragmentScanner />;
      case 'classification':
        return <FileClassification />;
      case 'graph':
        return <EvidenceGraph />;
      case 'tamper':
        return <TamperDetection setCurrentPage={setCurrentPage} />;
      case 'reconstruction':
        return <FileReconstruction />;
      case 'integrity':
        return <IntegrityChecker />;
      case 'copilot':
        return <AiCopilot />;
      case 'priority':
        return <ToolkitPriority />;
      case 'reports':
        return <PdfReports />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="main-content">
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="page-container flex-1 overflow-y-auto">
          <ErrorBoundary onNavigateDashboard={() => setCurrentPage('dashboard')}>
            {renderPage()}
          </ErrorBoundary>
        </main>
      </div>
      <NotificationToast />
      <SupabaseAuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ForensicProvider>
        <AppContent />
      </ForensicProvider>
    </AuthProvider>
  );
}
