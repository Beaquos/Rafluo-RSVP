import React from 'react';

export type StatusVariant = 'active' | 'disabled' | 'temporary' | 'inactive';

interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const getStyle = () => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
          dot: 'bg-[#10B981]',
          text: label || 'Ativo',
        };
      case 'disabled':
        return {
          bg: 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]',
          dot: 'bg-[#F43F5E]',
          text: label || 'Desativado',
        };
      case 'temporary':
        return {
          bg: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
          dot: 'bg-[#F97316]',
          text: label || 'Temporário',
        };
      case 'inactive':
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
          text: label || 'Inativo',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
          text: label || status,
        };
    }
  };

  const current = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-normal leading-tight border ${current.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} flex-shrink-0`} />
      <span>{current.text}</span>
    </span>
  );
};

export const ProfileChip: React.FC<{
  label: string;
  className?: string;
}> = ({ label, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[13px] font-medium bg-[#F4F2EE] text-[#24152F] border border-[#24152F]/10 truncate max-w-[200px] ${className}`}
    >
      {label}
    </span>
  );
};

export const YouBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold bg-[#E4FF4D] text-[#1A1033] ${className}`}
    >
      Você
    </span>
  );
};
