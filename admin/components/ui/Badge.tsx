import React from 'react';
import type { OrderStatus, PartnerStatus } from '../../types';

interface BadgeProps {
  status: OrderStatus | PartnerStatus | string;
}

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const statusStyles: { [key: string]: string } = {
    // Order statuses
    created: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    assigned: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    // Partner statuses
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-slate-100 text-slate-800 border-slate-200',
    banned: 'bg-red-100 text-red-800 border-red-200',
    // Default
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const style = statusStyles[status] || statusStyles.default;
  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${style}`}
    >
      {capitalizedStatus}
    </span>
  );
};

export default Badge;
