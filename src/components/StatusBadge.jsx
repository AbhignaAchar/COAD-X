import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, ShieldCheck } from 'lucide-react';

export default function StatusBadge({ status, type }) {
  let badgeClass = 'badge-info';
  let icon = <Info className="w-3.5 h-3.5" />;
  const label = status || 'Unknown';

  const normalized = (status || type || '').toLowerCase();

  if (normalized.includes('verified') || normalized.includes('succeeded') || normalized.includes('intact') || normalized.includes('complete') || normalized.includes('natural')) {
    badgeClass = 'badge-success';
    icon = <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />;
  } else if (normalized.includes('critical') || normalized.includes('corrupt') || normalized.includes('mismatch') || normalized.includes('failed') || normalized.includes('tampered')) {
    badgeClass = 'badge-danger';
    icon = <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />;
  } else if (normalized.includes('partial') || normalized.includes('suspicious') || normalized.includes('warning') || normalized.includes('pending') || normalized.includes('medium')) {
    badgeClass = 'badge-warning';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />;
  } else if (normalized.includes('processing') || normalized.includes('reconstructing') || normalized.includes('matching')) {
    badgeClass = 'badge-processing';
    icon = <Info className="w-3.5 h-3.5 text-[#2563EB]" />;
  } else if (normalized.includes('scanned') || normalized.includes('demo') || normalized.includes('candidate')) {
    badgeClass = 'badge-info';
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#0891B2]" />;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
