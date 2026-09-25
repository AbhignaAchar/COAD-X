import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseSignUp, supabaseSignIn } from '../utils/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Session persistence in sessionStorage (cleared when browser session ends)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('coadx_auth_state') === 'authenticated';
    } catch {
      return false;
    }
  });

  const [authMethod, setAuthMethod] = useState(() => {
    try {
      return sessionStorage.getItem('coadx_auth_method') || (isAuthenticated ? 'Supabase Email Auth' : null);
    } catch {
      return null;
    }
  });

  const [isFaceEnrolled, setIsFaceEnrolled] = useState(() => {
    try {
      return localStorage.getItem('coadx_face_enrolled') === 'true';
    } catch {
      return false;
    }
  });

  const [userProfile, setUserProfile] = useState(() => {
    const savedMethod = sessionStorage.getItem('coadx_auth_method') || 'Guest Explorer';
    const savedEmail = sessionStorage.getItem('coadx_user_email') || 'examiner@coadx.org';
    const savedName = sessionStorage.getItem('coadx_user_name') || 'Chirag';

    return {
      name: savedName,
      role: 'Lead Cyber Forensic Examiner',
      email: savedEmail,
      badgeId: 'CX-8841-A',
      clearanceLevel: 'Tier-1 Security Clearance',
      department: 'Cyber Operations & Anomaly Detection',
      authMethod: savedMethod,
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarInitials: savedName ? savedName.slice(0, 2).toUpperCase() : 'CX'
    };
  });

  // Modal State for Evidence Upload Gate
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingUploadCallback, setPendingUploadCallback] = useState(null);

  /**
   * Evidence Upload Gatekeeper:
   * Free platform access is enabled. If an unauthenticated user attempts to upload evidence,
   * prompt them to Sign Up or Sign In via Supabase Email Auth.
   */
  const requireAuthForUpload = (callback) => {
    if (isAuthenticated) {
      if (typeof callback === 'function') callback();
      return true;
    }
    setPendingUploadCallback(() => callback);
    setIsAuthModalOpen(true);
    return false;
  };

  /**
   * Supabase Email Sign Up
   */
  const signUpWithEmail = async (email, password, name) => {
    const res = await supabaseSignUp({ email, password, name });
    const user = res.user;

    setIsAuthenticated(true);
    setAuthMethod('Supabase Email Auth');
    setUserProfile(prev => ({
      ...prev,
      name: user.name,
      email: user.email,
      role: user.role || 'Forensic Examiner',
      authMethod: 'Supabase Email Auth',
      avatarInitials: user.name ? user.name.slice(0, 2).toUpperCase() : 'CX'
    }));

    try {
      sessionStorage.setItem('coadx_auth_state', 'authenticated');
      sessionStorage.setItem('coadx_auth_method', 'Supabase Email Auth');
      sessionStorage.setItem('coadx_user_email', user.email);
      sessionStorage.setItem('coadx_user_name', user.name);
    } catch (e) {
      console.warn('sessionStorage error:', e);
    }

    setIsAuthModalOpen(false);

    // Execute pending upload if user was trying to upload
    if (pendingUploadCallback) {
      setTimeout(() => {
        pendingUploadCallback();
        setPendingUploadCallback(null);
      }, 100);
    }

    return res;
  };

  /**
   * Supabase Email Sign In
   */
  const signInWithEmail = async (email, password) => {
    const res = await supabaseSignIn({ email, password });
    const user = res.user;

    setIsAuthenticated(true);
    setAuthMethod('Supabase Email Auth');
    setUserProfile(prev => ({
      ...prev,
      name: user.name,
      email: user.email,
      role: user.role || 'Forensic Examiner',
      authMethod: 'Supabase Email Auth',
      avatarInitials: user.name ? user.name.slice(0, 2).toUpperCase() : 'CX'
    }));

    try {
      sessionStorage.setItem('coadx_auth_state', 'authenticated');
      sessionStorage.setItem('coadx_auth_method', 'Supabase Email Auth');
      sessionStorage.setItem('coadx_user_email', user.email);
      sessionStorage.setItem('coadx_user_name', user.name);
    } catch (e) {
      console.warn('sessionStorage error:', e);
    }

    setIsAuthModalOpen(false);

    // Execute pending upload if user was trying to upload
    if (pendingUploadCallback) {
      setTimeout(() => {
        pendingUploadCallback();
        setPendingUploadCallback(null);
      }, 100);
    }

    return res;
  };

  /**
   * Legacy / Alternate Password Authentication
   */
  const loginWithPassword = (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const cleanUser = (username || '').trim().toLowerCase();
        const cleanPass = (password || '').trim();

        if (!cleanUser) {
          return reject(new Error('Please enter your username.'));
        }
        if (!cleanPass) {
          return reject(new Error('Please enter your password.'));
        }

        const validUsers = ['chirag', 'chirag.forensics@coad-x.gov', 'analyst', 'admin', 'investigator'];
        const validPasswords = ['coadx2026', 'password123', 'coadx123', 'admin123', 'forensics2026'];

        const isValid = validUsers.includes(cleanUser) && validPasswords.includes(cleanPass);
        if (!isValid) {
          return reject(new Error('Invalid username or password.'));
        }

        setAuthMethod('Password');
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('coadx_auth_state', 'authenticated');
          sessionStorage.setItem('coadx_auth_method', 'Password');
        } catch (e) {}

        setIsAuthModalOpen(false);
        if (pendingUploadCallback) {
          pendingUploadCallback();
          setPendingUploadCallback(null);
        }

        resolve({ success: true, user: userProfile });
      }, 700);
    });
  };

  /**
   * Alternate Face Authentication
   */
  const loginWithFace = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setAuthMethod('Face Authentication');
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('coadx_auth_state', 'authenticated');
          sessionStorage.setItem('coadx_auth_method', 'Face Authentication');
        } catch (e) {}

        setIsAuthModalOpen(false);
        if (pendingUploadCallback) {
          pendingUploadCallback();
          setPendingUploadCallback(null);
        }

        resolve({ success: true, user: userProfile });
      }, 600);
    });
  };

  const enrollFace = () => {
    setIsFaceEnrolled(true);
    try {
      localStorage.setItem('coadx_face_enrolled', 'true');
    } catch (e) {}
  };

  const resetFaceEnrollment = () => {
    setIsFaceEnrolled(false);
    try {
      localStorage.removeItem('coadx_face_enrolled');
    } catch (e) {}
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthMethod(null);
    try {
      sessionStorage.removeItem('coadx_auth_state');
      sessionStorage.removeItem('coadx_auth_method');
      sessionStorage.removeItem('coadx_user_email');
      sessionStorage.removeItem('coadx_user_name');
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authMethod,
        userProfile,
        isFaceEnrolled,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => {
          setIsAuthModalOpen(false);
          setPendingUploadCallback(null);
        },
        requireAuthForUpload,
        signUpWithEmail,
        signInWithEmail,
        loginWithPassword,
        loginWithFace,
        enrollFace,
        resetFaceEnrollment,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
