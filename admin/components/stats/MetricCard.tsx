import React from 'react';
import Card from '../ui/Card';

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  isLoading: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, isLoading }) => {
  return (
    <Card>
      {isLoading ? (
        <div className="animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-slate-200 rounded w-3/4"></div>
        </div>
      ) : (
        <>
            <p className="text-w-text-muted text-sm font-medium">{label}</p>
            <div className="flex items-baseline space-x-2 mt-1">
                <p className="text-4xl font-bold text-w-text-main">{value}</p>
                {change && <span className="text-sm font-semibold text-green-500">{change}</span>}
            </div>
        </>
      )}
    </Card>
  );
};

export default MetricCard;
