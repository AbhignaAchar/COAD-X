import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FileScan,
  FileType,
  GitFork,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Bot,
  BarChart3,
  FileText,
  Trash2,
  Database,
  LogOut
} from 'lucide-react';
import { useForensic } from '../context/ForensicContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentPage, setCurrentPage }) {
  const { evidenceFiles, fragments, clearSession, loadSampleData } = useForensic();
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'upload', label: 'Evidence Upload', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'scanner', label: 'Fragment Scanner', icon: <FileScan className="w-4 h-4" /> },
    { id: 'classification', label: 'File Classification', icon: <FileType className="w-4 h-4" /> },
    { id: 'graph', label: 'Evidence Graph', icon: <GitFork className="w-4 h-4" /> },
    { id: 'tamper', label: 'Tamper Detection', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'reconstruction', label: 'File Reconstruction', icon: <Cpu className="w-4 h-4" /> },
    { id: 'integrity', label: 'Integrity Checker', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'copilot', label: 'AI Copilot', icon: <Bot className="w-4 h-4" /> },
    { id: 'priority', label: 'Priority Matrix', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reports', label: 'PDF Reports', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#DCE5EF] flex flex-col h-screen select-none shrink-0 shadow-[1px_0_3px_rgba(15,23,42,0.03)] z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#DCE5EF] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#0F2747] flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-5 h-5 text-[#0891B2]" />
        </div>
        <div>
          <h1 className="font-extrabold text-base text-[#0F172A] tracking-wider flex items-center gap-1.5 leading-none">
            COAD-X
            <span className="text-[10px] bg-[#ECFEFF] text-[#0891B2] border border-[#A5F3FC] px-1.5 py-0.5 rounded font-mono font-semibold">
              v1.0
            </span>
          </h1>
          <p className="text-[11px] text-[#64748B] font-medium tracking-tight mt-1">Cyber Forensic Platform</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        <div className="text-[10px] font-bold text-[#64748B] uppercase px-3 py-1.5 tracking-wider">
          Forensic Intelligence
        </div>

        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-[#ECFEFF] text-[#0F172A] font-semibold border-l-[3px] border-[#0891B2] rounded-r-lg shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0F7FD] rounded-lg'
              }`}
            >
              <span className={`transition-colors duration-150 ${isActive ? 'text-[#0891B2]' : 'text-[#64748B] group-hover:text-[#0891B2]'}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Session Quick Actions & Footer */}
      <div className="p-3.5 border-t border-[#DCE5EF] space-y-2 bg-[#F8FAFC]">
        <button
          onClick={loadSampleData}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-[#F0F7FD] text-[#0F172A] text-xs font-medium rounded-lg border border-[#DCE5EF] transition-all duration-150 shadow-2xs"
        >
          <Database className="w-3.5 h-3.5 text-[#0891B2]" />
          <span>Load Sample Evidence</span>
        </button>

        <button
          onClick={clearSession}
          disabled={evidenceFiles.length === 0 && fragments.length === 0}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-medium rounded-lg border border-[#FECACA] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Session</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-[#F0F7FD] text-[#64748B] hover:text-[#0F172A] text-xs font-medium rounded-lg border border-[#DCE5EF] transition-all duration-150 shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Sign Out / Lock</span>
        </button>

        <div className="pt-2 text-[10px] text-[#64748B] text-center flex items-center justify-between border-t border-[#DCE5EF]">
          <span>Client In-Memory</span>
          <span className="text-[#16A34A] font-semibold font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span> Active
          </span>
        </div>
      </div>
    </aside>
  );
}
