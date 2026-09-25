import React, { useState } from 'react';
import { Shield, FileCheck, Layers, RefreshCw, Mic, Search, Bell, User, LogOut, LogIn } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import { useAuth } from '../context/AuthContext';
import VoiceAgentModal from './VoiceAgentModal';
import AuthProfileModal from './AuthProfileModal';

export default function Header({ currentPage, setCurrentPage }) {
  const { caseId, evidenceFiles, fragments, reconstructedFiles, clearSession } = useForensic();
  const { userProfile, authMethod, logout, isAuthenticated, openAuthModal } = useAuth();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getPageTitle = (id) => {
    switch (id) {
      case 'dashboard': return 'System Dashboard & Recovery Pipeline';
      case 'upload': return 'Evidence Ingestion & Upload';
      case 'scanner': return 'Byte Fragment Scanner';
      case 'classification': return 'File Classification & Type Analysis';
      case 'graph': return 'Evidence & Fragment Graph';
      case 'tamper': return 'Tamper & Anti-Forensics Detection';
      case 'reconstruction': return 'File Reconstruction Engine';
      case 'integrity': return 'SHA-256 Integrity Verification';
      case 'copilot': return 'AI Forensic Copilot';
      case 'priority': return 'Toolkit & Recovery Priority';
      case 'reports': return 'Forensic PDF Reports';
      default: return 'Forensic Recovery Workbench';
    }
  };

  const verifiedCount = reconstructedFiles.filter(r => r.integrityStatus === 'Verified' || r.integrity === 'VERIFIED').length;

  return (
    <>
      <header className="h-15 bg-white border-b border-[#DCE5EF] px-5 flex items-center justify-between shrink-0 select-none shadow-[0_1px_2px_rgba(15,23,42,0.03)] z-30">
        {/* Left: Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              {getPageTitle(currentPage)}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span>Platform</span>
            <span>/</span>
            <span>Case:</span>
            <span className="font-mono text-[#0891B2] font-bold text-[11px] bg-[#ECFEFF] border border-[#A5F3FC] px-1.5 py-0.2 rounded">
              {caseId}
            </span>
          </div>
        </div>

        {/* Center: Search Input */}
        <div className="hidden md:flex items-center relative max-w-sm w-full mx-4">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search evidence, hashes, fragments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#DCE5EF] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0891B2] focus:bg-white focus:shadow-[0_0_0_2px_rgba(8,145,178,0.12)] transition-all"
          />
        </div>

        {/* Right Actions: Voice Agent, Quick Stats, Session Tools, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Voice Agent Microphone Trigger */}
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#ECFEFF] hover:bg-[#E0F7FA] text-[#0891B2] border border-[#A5F3FC] hover:border-[#0891B2] rounded-lg text-xs font-semibold transition-all shadow-2xs group"
            title="Open Voice Intelligence Agent (Multilingual: EN, HI, KN)"
          >
            <Mic className="w-3.5 h-3.5 text-[#0891B2] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Voice Agent</span>
          </button>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex items-center gap-2.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#DCE5EF] rounded-lg text-xs">
            <div className="flex items-center gap-1.5 text-[#64748B]">
              <Shield className="w-3.5 h-3.5 text-[#0891B2]" />
              <span className="font-bold font-mono text-[#0F172A]">{evidenceFiles.length}</span>
              <span className="text-[#64748B] text-[11px]">Files</span>
            </div>

            <div className="w-px h-3.5 bg-[#DCE5EF]"></div>

            <div className="flex items-center gap-1.5 text-[#64748B]">
              <Layers className="w-3.5 h-3.5 text-[#0284C7]" />
              <span className="font-bold font-mono text-[#0F172A]">{fragments.length.toLocaleString()}</span>
              <span className="text-[#64748B] text-[11px]">Frags</span>
            </div>

            <div className="w-px h-3.5 bg-[#DCE5EF]"></div>

            <div className="flex items-center gap-1.5 text-[#64748B]">
              <FileCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="font-bold font-mono text-[#16A34A]">{verifiedCount}</span>
              <span className="text-[#64748B] text-[11px]">Verified</span>
            </div>
          </div>

          {/* Reset / Clear Session Memory */}
          <button
            onClick={clearSession}
            title="Reset Session Memory"
            className="p-1.5 bg-[#F8FAFC] hover:bg-[#F0F7FD] text-[#64748B] hover:text-[#DC2626] rounded-lg border border-[#DCE5EF] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Authentication State / Profile */}
          {isAuthenticated ? (
            <>
              {/* User Profile Avatar Pill - Clickable to open Profile & Authentication UI */}
              <button
                onClick={() => setIsProfileOpen(true)}
                title="Open Profile & Examiner Enclave"
                className="flex items-center gap-2 pl-2 border-l border-[#DCE5EF] hover:opacity-90 transition-opacity text-left focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-[#0F2747] text-white flex items-center justify-center font-bold text-xs shadow-2xs ring-1 ring-[#DCE5EF]">
                  {userProfile?.avatarInitials || (userProfile?.name ? userProfile.name.slice(0, 2).toUpperCase() : 'EX')}
                </div>
                <div className="hidden xl:block text-left">
                  <span className="block text-xs font-bold text-[#0F172A] leading-none truncate max-w-[120px]">
                    {userProfile?.name || 'Examiner'}
                  </span>
                  <span className="block text-[10px] text-[#0891B2] font-medium leading-tight truncate max-w-[120px]">
                    {authMethod || 'Supabase Auth'}
                  </span>
                </div>
              </button>

              {/* Quick Sign Out Action */}
              <button
                onClick={logout}
                title="Sign Out of Examiner Session"
                className="p-1.5 bg-[#F8FAFC] hover:bg-[#FEF2F2] text-[#64748B] hover:text-[#DC2626] rounded-lg border border-[#DCE5EF] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-[#DCE5EF]">
              <span className="hidden xl:inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#F8FAFC] text-[#64748B] border border-[#DCE5EF]">
                Free Mode
              </span>
              <button
                onClick={openAuthModal}
                title="Sign In or Sign Up via Supabase Email Auth to Upload Evidence"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0F2747] hover:bg-[#163866] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#0891B2]" />
                <span>Sign In / Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Multilingual Voice Agent Modal */}
      <VoiceAgentModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        setCurrentPage={setCurrentPage}
      />

      {/* User Profile Modal */}
      <AuthProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
