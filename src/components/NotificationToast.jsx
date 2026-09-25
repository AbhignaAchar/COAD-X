import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useForensic } from '../context/ForensicContext';

export default function NotificationToast() {
  const { toastMessage } = useForensic();

  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.9)',
          border: '#10b981',
          icon: <CheckCircle className="w-5 h-5 text-white" />
        };
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.9)',
          border: '#ef4444',
          icon: <AlertCircle className="w-5 h-5 text-white" />
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.9)',
          border: '#f59e0b',
          icon: <AlertCircle className="w-5 h-5 text-white" />
        };
      default:
        return {
          bg: 'rgba(6, 182, 212, 0.9)',
          border: '#06b6d4',
          icon: <Info className="w-5 h-5 text-white" />
        };
    }
  };

  const style = getStyle();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: style.bg,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${style.border}`,
        borderRadius: '10px',
        padding: '12px 18px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        maxWidth: '420px',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      {style.icon}
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
    </div>
  );
}
