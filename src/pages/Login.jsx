import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Key,
  Camera,
  ScanFace,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const {
    loginWithPassword,
    loginWithFace,
    isFaceEnrolled,
    enrollFace
  } = useAuth();

  const [authMethod, setAuthMethod] = useState('password'); // 'password' or 'face'

  // --- Password State ---
  const [username, setUsername] = useState('chirag');
  const [password, setPassword] = useState('coadx2026');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);

  // --- Face Auth State ---
  // UI states: 'idle' | 'initializing' | 'position' | 'detected' | 'verifying' | 'success' | 'failed' | 'setup-confirm'
  const [faceState, setFaceState] = useState('idle');
  const [faceError, setFaceError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [isSimulatedStream, setIsSimulatedStream] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionTimerRef = useRef(null);

  // Clean up camera stream on unmount or tab change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (detectionTimerRef.current) {
      clearTimeout(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsSimulatedStream(false);
  };

  // Switch between Password and Face methods
  const handleSwitchMethod = (method) => {
    if (authMethod !== method) {
      stopCamera();
      setAuthMethod(method);
      setPasswordError('');
      setFaceError('');
      setFaceState('idle');
    }
  };

  // ==========================================
  // 1. Password Login Handler
  // ==========================================
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!username.trim()) {
      setPasswordError('Please enter your username.');
      return;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      return;
    }

    setIsPasswordLoading(true);
    try {
      await loginWithPassword(username, password);
      setIsPasswordSuccess(true);
      setIsPasswordLoading(false);
      // App.jsx will automatically transition to Dashboard because isAuthenticated becomes true
    } catch (err) {
      setIsPasswordLoading(false);
      setPasswordError(err.message || 'Invalid username or password.');
    }
  };

  // ==========================================
  // 2. Camera Initialization
  // ==========================================
  const startCameraStream = async () => {
    stopCamera();
    setFaceError('');
    setFaceState('initializing');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API unsupported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      runFaceDetectionSequence();
    } catch (err) {
      console.warn('Camera access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setFaceError('Camera permission is required for face authentication.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setFaceError('No camera was detected.');
      } else {
        setFaceError('No camera was detected or permission was not granted.');
      }
      setFaceState('failed');
    }
  };

  // Demo Fallback: Simulated Camera for headless/virtual or non-webcam devices
  const startSimulatedCamera = () => {
    stopCamera();
    setFaceError('');
    setFaceState('initializing');
    setIsSimulatedStream(true);
    setCameraActive(true);

    setTimeout(() => {
      runFaceDetectionSequence();
    }, 600);
  };

  // ==========================================
  // 3. Face Detection & Verification Sequence
  // ==========================================
  const runFaceDetectionSequence = () => {
    // Step 1: Position your face inside the frame
    setFaceState('position');

    detectionTimerRef.current = setTimeout(() => {
      // Step 2: Face detected
      setFaceState('detected');

      detectionTimerRef.current = setTimeout(() => {
        // Step 3: Verifying identity...
        setFaceState('verifying');

        detectionTimerRef.current = setTimeout(async () => {
          if (!isFaceEnrolled) {
            // First time setup: prompt confirmation
            setFaceState('setup-confirm');
          } else {
            // Existing enrolled user: successful authentication
            setFaceState('success');
            setTimeout(async () => {
              stopCamera();
              await loginWithFace();
              // App.jsx transitions to Dashboard
            }, 600);
          }
        }, 1200);
      }, 1000);
    }, 1200);
  };

  // Complete First-Time Setup
  const handleConfirmFaceSetup = async () => {
    enrollFace();
    setFaceState('success');
    setTimeout(async () => {
      stopCamera();
      await loginWithFace();
    }, 700);
  };

  // Retry Face Auth
  const handleRetryFace = () => {
    setFaceError('');
    startCameraStream();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden">
        {/* Brand Header */}
        <div className="pt-8 pb-6 px-8 text-center border-b border-[#E2E8F0] bg-white">
          <div className="w-12 h-12 rounded-xl bg-[#0F2747] text-white flex items-center justify-center mx-auto shadow-md mb-3">
            <ShieldCheck className="w-6 h-6 text-[#0F8FB3]" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0F2747] tracking-tight">
            COAD-X
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Cyber Forensic Intelligence & Evidence Platform
          </p>
        </div>

        {/* Auth Method Selector Tabs */}
        <div className="p-2 bg-[#F8FAFC] border-b border-[#E2E8F0] grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleSwitchMethod('password')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              authMethod === 'password'
                ? 'bg-white text-[#0F2747] shadow-sm border border-[#E2E8F0]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-[#0F8FB3]" />
            <span>Password Login</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMethod('face')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              authMethod === 'face'
                ? 'bg-white text-[#0F2747] shadow-sm border border-[#E2E8F0]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5 text-[#0F8FB3]" />
            <span>Face Authentication</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8">
          {/* ==================================================== */}
          {/* METHOD 1: PASSWORD AUTHENTICATION                    */}
          {/* ==================================================== */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F2747] mb-1.5">
                  Email / Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="analyst@coad-x.gov or chirag"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F8FB3] focus:ring-1 focus:ring-[#0F8FB3] transition-all"
                  disabled={isPasswordLoading || isPasswordSuccess}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F2747] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Enter case security credentials"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F8FB3] focus:ring-1 focus:ring-[#0F8FB3] transition-all font-mono"
                    disabled={isPasswordLoading || isPasswordSuccess}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-600 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Success Message */}
              {isPasswordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700 animate-fadeIn font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Authentication verified. Initializing secure workspace...</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPasswordLoading || isPasswordSuccess}
                className="w-full py-2.5 px-4 bg-[#0F8FB3] hover:bg-[#0D7A99] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                {isPasswordLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : isPasswordSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Access Granted</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to Platform</span>
                  </>
                )}
              </button>

              {/* Discreet Demo Helper */}
              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                  Demo credentials: <strong className="text-slate-600">chirag</strong> / <strong className="text-slate-600">coadx2026</strong>
                </span>
              </div>
            </form>
          )}

          {/* ==================================================== */}
          {/* METHOD 2: FACE AUTHENTICATION (DEMO)                 */}
          {/* ==================================================== */}
          {authMethod === 'face' && (
            <div className="space-y-4">
              {/* Feature Badge & Transparency Disclaimer */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F6FA] text-[#0F8FB3] border border-[#BAE6FD]">
                  <ScanFace className="w-3 h-3" />
                  Face Authentication — Demo
                </span>
                <span className="text-[10px] text-slate-400">
                  {isFaceEnrolled ? 'Biometric Profile Active' : 'Setup Required'}
                </span>
              </div>

              {/* Non-Production Transparency Alert */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-[11px] text-slate-600">
                <Info className="w-3.5 h-3.5 text-[#0F8FB3] shrink-0 mt-0.5" />
                <p>
                  Demonstration biometric scanner using in-browser geometry alignment. Production platforms enforce FIDO2 / WebAuthn hardware tokens.
                </p>
              </div>

              {/* Camera Preview Area */}
              <div className="relative w-full aspect-[4/3] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                {/* Real Video Stream */}
                {cameraActive && !isSimulatedStream && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                )}

                {/* Simulated Camera Feed (Fallback for devices without camera) */}
                {cameraActive && isSimulatedStream && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm mb-2">
                      <ScanFace className="w-10 h-10 text-[#0F8FB3] animate-pulse" />
                    </div>
                    <span className="text-xs font-semibold text-[#0F2747]">
                      Virtual Forensic Scanner Active
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Analyzing head tilt & biometric coordinates
                    </span>
                  </div>
                )}

                {/* Idle / Off State */}
                {!cameraActive && (
                  <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                      <Camera className="w-6 h-6 text-[#0F8FB3]" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {isFaceEnrolled
                        ? 'Camera is currently off'
                        : 'Face authentication is not yet configured'}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-[240px]">
                      {isFaceEnrolled
                        ? 'Click below to verify your face and access the workspace.'
                        : 'Capture your face coordinates once to activate instant face login.'}
                    </p>
                  </div>
                )}

                {/* Overlay Face Frame */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                    {/* Face Guide Oval */}
                    <div
                      className={`w-36 h-48 sm:w-44 sm:h-56 rounded-[50%] border-2 transition-all duration-300 flex items-center justify-center ${
                        faceState === 'success'
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : faceState === 'failed'
                          ? 'border-red-500 bg-red-500/10'
                          : faceState === 'verifying' || faceState === 'detected'
                          ? 'border-[#0F8FB3] bg-[#0F8FB3]/10 animate-pulse'
                          : 'border-slate-300 border-dashed'
                      }`}
                    >
                      {faceState === 'verifying' && (
                        <div className="w-full h-1 bg-[#0F8FB3] animate-bounce opacity-80" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Indicator Bar */}
              {cameraActive && (
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    {faceState === 'initializing' && (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-[#0F8FB3] animate-spin" />
                        <span className="text-xs font-semibold text-[#0F2747]">Initializing camera...</span>
                      </>
                    )}
                    {faceState === 'position' && (
                      <>
                        <ScanFace className="w-3.5 h-3.5 text-[#0F8FB3]" />
                        <span className="text-xs font-semibold text-[#0F2747]">Position your face inside the frame</span>
                      </>
                    )}
                    {faceState === 'detected' && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0F8FB3]" />
                        <span className="text-xs font-semibold text-[#0F2747]">Face detected</span>
                      </>
                    )}
                    {faceState === 'verifying' && (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-[#0F8FB3] animate-spin" />
                        <span className="text-xs font-semibold text-[#0F2747]">Verifying identity...</span>
                      </>
                    )}
                    {faceState === 'setup-confirm' && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">Facial Geometry Matched</span>
                      </>
                    )}
                    {faceState === 'success' && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">Authentication successful</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {faceError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-600 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{faceError}</span>
                  </div>
                </div>
              )}

              {/* Actions depending on Enrollment and State */}
              <div className="space-y-2 pt-1">
                {/* Case 1: First-Time Setup Confirmation */}
                {faceState === 'setup-confirm' ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-xs text-emerald-800">
                      <strong>Face Authentication Enabled</strong>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        Biometric profile registered for Examiner Chirag.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmFaceSetup}
                      className="w-full py-2.5 px-4 bg-[#0F8FB3] hover:bg-[#0D7A99] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Complete Login to Dashboard</span>
                    </button>
                  </div>
                ) : !cameraActive ? (
                  /* Case 2: Camera Inactive -> Start Face Auth or First Time Setup */
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={startCameraStream}
                      className="w-full py-2.5 px-4 bg-[#0F8FB3] hover:bg-[#0D7A99] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>
                        {isFaceEnrolled
                          ? 'Continue with Face Authentication'
                          : 'Set up Face Authentication'}
                      </span>
                    </button>

                    {/* Simulation Option for Environments without Webcams */}
                    <button
                      type="button"
                      onClick={startSimulatedCamera}
                      className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-[#0F2747] border border-[#E2E8F0] rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ScanFace className="w-3 h-3 text-[#0F8FB3]" />
                      <span>Run Demo Biometric Simulator (No Camera Required)</span>
                    </button>
                  </div>
                ) : (
                  /* Case 3: Camera Active -> Options to Retry or Cancel */
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetryFace}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-[#0F2747] border border-[#E2E8F0] rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3 text-[#0F8FB3]" />
                      <span>Scan Again</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                    >
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-3 px-6 bg-[#F8FAFC] border-t border-[#E2E8F0] text-center">
          <p className="text-[11px] text-slate-400">
            COAD-X Forensic Protocol v1.0 • Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
