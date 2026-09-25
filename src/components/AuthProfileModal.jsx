import React, { useState } from 'react';
import {
  Shield,
  User,
  Key,
  ScanFace,
  CheckCircle2,
  Lock,
  X,
  LogOut,
  ShieldCheck,
  Fingerprint,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthProfileModal({ isOpen, onClose }) {
  const {
    userProfile,
    authMethod,
    isFaceEnrolled,
    enrollFace,
    resetFaceEnrollment,
    logout
  } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'security'
  const [resetMessage, setResetMessage] = useState('');

  if (!isOpen) return null;

  const handleLogout = () => {
    onClose();
    logout();
  };

  const handleToggleFaceEnrollment = () => {
    if (isFaceEnrolled) {
      resetFaceEnrollment();
      setResetMessage('Face authentication profile cleared.');
    } else {
      enrollFace();
      setResetMessage('Face authentication profile activated.');
    }
    setTimeout(() => setResetMessage(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-lg shadow-[0_4px_24px_rgba(15,23,42,0.08)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6F6FA] border border-[#BAE6FD] flex items-center justify-center text-[#0F8FB3]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F2747] leading-none">
                Examiner Profile & Authentication
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                COAD-X Security Credential & Biometric Enclave
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#0F8FB3] text-[#0F8FB3] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-[#0F8FB3] text-[#0F8FB3] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Authentication Methods</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-white space-y-4">
          {/* TAB 1: PROFILE OVERVIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#0F2747] text-white flex items-center justify-center font-extrabold text-xl shadow-sm border-2 border-white">
                  {userProfile.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#0F2747]">
                      {userProfile.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Session
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {userProfile.role}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Badge:</span>
                    <span className="font-mono font-semibold text-[#0F8FB3]">
                      {userProfile.badgeId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Forensic Details List */}
              <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] text-xs">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Official Email</span>
                  <span className="font-semibold text-[#0F2747]">{userProfile.email}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Current Login Method</span>
                  <span className="font-semibold text-[#0F8FB3] flex items-center gap-1.5">
                    {authMethod === 'Face Authentication' ? (
                      <ScanFace className="w-3.5 h-3.5 text-[#0F8FB3]" />
                    ) : (
                      <Key className="w-3.5 h-3.5 text-[#0F8FB3]" />
                    )}
                    {authMethod || 'Password'}
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Security Clearance</span>
                  <span className="font-medium text-slate-800">{userProfile.clearanceLevel}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">Division</span>
                  <span className="font-medium text-slate-800">{userProfile.department}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="py-2 px-3 text-xs text-[#0F8FB3] hover:underline flex items-center gap-1 font-semibold"
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>Configure Face Biometrics</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & AUTHENTICATION CONFIG */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Method 1: Password Status */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F8FB3] shadow-xs">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0F2747]">Password Authentication</h5>
                    <p className="text-[11px] text-slate-500">Cryptographic hash-verified credentials</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Always Active
                </span>
              </div>

              {/* Method 2: Face Authentication Status */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F8FB3] shadow-xs">
                    <ScanFace className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0F2747]">
                      Face Authentication — Demo
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {isFaceEnrolled
                        ? 'Facial coordinate profile enrolled for instant login'
                        : 'Face enrollment not yet established'}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isFaceEnrolled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {isFaceEnrolled ? 'Enrolled' : 'Not Configured'}
                </span>
              </div>

              {resetMessage && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 text-center font-medium animate-fadeIn">
                  {resetMessage}
                </div>
              )}

              {/* Biometric Configuration Actions */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handleToggleFaceEnrollment}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-[#0F2747] border border-[#E2E8F0] rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#0F8FB3]" />
                  <span>
                    {isFaceEnrolled
                      ? 'Reset / Clear Face Biometric Enrollment'
                      : 'Enroll Face Authentication for Chirag'}
                  </span>
                </button>
              </div>

              {/* Logout Button */}
              <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Terminal</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#0F8FB3]" /> COAD-X Cryptographic Session
          </span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-[#0F2747] font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
