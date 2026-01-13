import React from 'react';
import { FilterStatus } from '../types';

interface StatusTabSwitcherProps {
    activeFilter: FilterStatus;
    onFilterChange: (filter: FilterStatus) => void;
}

const statusTabs: { id: FilterStatus; label: string }[] = [
    { id: 'dropped_at_laundry', label: 'In Shop' },
    { id: 'washing', label: 'Washing' },
    { id: 'ready_for_pick', label: 'Ready' },
];

const StatusTabSwitcher: React.FC<StatusTabSwitcherProps> = ({ activeFilter, onFilterChange }) => {
    return (
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex space-x-1">
            {statusTabs.map(tab => {
                const isActive = activeFilter === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onFilterChange(tab.id)}
                        className={`w-full text-center px-4 py-3 rounded-lg font-bold transition-all text-sm
                            ${isActive ? 'bg-primary text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};

export default StatusTabSwitcher;
