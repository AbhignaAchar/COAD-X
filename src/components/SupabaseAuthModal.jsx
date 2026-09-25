import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  UploadCloud,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SupabaseAuthModal({ isOpen, onClose, onAuthSuccess }) {
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const res = await signUpWithEmail(email, password, name);
        setSuccessMsg('Account created successfully via Supabase! Moving forward to evidence upload...');
        setTimeout(() => {
          setIsLoading(false);
          if (onAuthSuccess) onAuthSuccess(res.user);
          if (onClose) onClose();
        }, 800);
      } else {
        const res = await signInWithEmail(email, password);
        setSuccessMsg('Signed in successfully! Moving forward to evidence upload...');
        setTimeout(() => {
          setIsLoading(false);
          if (onAuthSuccess) onAuthSuccess(res.user);
          if (onClose) onClose();
        }, 800);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('analyst.forensics@coadx.org');
    setPassword('CoadXForensics2026!');
    setName('Chirag');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn select-none">
      <div className="bg-white border border-[#DCE5EF] rounded-xl w-full max-w-md shadow-[0_8px_30px_rgba(15,23,42,0.12)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#DCE5EF] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F2747] text-white flex items-center justify-center shadow-2xs">
              <UploadCloud className="w-5 h-5 text-[#0891B2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] leading-none">
                Evidence Upload Access Gate
              </h3>
              <p className="text-[11px] text-[#64748B] mt-1">
                Supabase Email Authentication Required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Access Notice Pill */}
        <div className="px-6 py-3 bg-[#ECFEFF] border-b border-[#A5F3FC] flex items-center gap-2 text-xs text-[#0F172A]">
          <Sparkles className="w-4 h-4 text-[#0891B2] shrink-0" />
          <p className="text-[11px] leading-tight text-[#64748B]">
            <strong className="text-[#0F172A]">Free Platform Access:</strong> Anyone can explore sample evidence for free. To upload and process custom evidence files, sign in or sign up below.
          </p>
        </div>

        {/* Tabs: Sign In vs Sign Up */}
        <div className="p-2 bg-[#F8FAFC] border-b border-[#DCE5EF] grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              mode === 'signin'
                ? 'bg-white text-[#0F172A] shadow-2xs border border-[#DCE5EF]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Sign In to Upload
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#0F172A] shadow-2xs border border-[#DCE5EF]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Create Free Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-[#0F2747] mb-1">
                Full Name / Examiner Handle
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chirag (Lead Investigator)"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F8FB3] transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F2747] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@agency.org or your email"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F8FB3] transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F2747] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-9 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F8FB3] transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-600 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700 animate-fadeIn font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#0F8FB3] hover:bg-[#0D7A99] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting to Supabase Auth...</span>
              </>
            ) : mode === 'signup' ? (
              <>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Create Account & Upload Evidence</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In & Continue Upload</span>
              </>
            )}
          </button>

          {/* Quick Demo Helper */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="text-[11px] text-[#0F8FB3] hover:underline"
            >
              Fill Demo Examiner Credentials
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="py-2.5 px-6 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-400">
          <span>Supabase Auth Protocol</span>
          <button onClick={onClose} className="hover:text-slate-600 font-medium">
            Continue Free Exploration
          </button>
        </div>
      </div>
    </div>
  );
}
