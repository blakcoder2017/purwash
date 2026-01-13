
import React from 'react';

interface TimelineProps {
  statuses: string[];
  currentStatus: string;
}

const Timeline: React.FC<TimelineProps> = ({ statuses, currentStatus }) => {
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <ol className="relative border-l border-slate-300">
        {statuses.map((status, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <li key={status} className="mb-10 ml-6">
              <span
                className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-background
                  ${isCompleted ? 'bg-primary' : 'bg-slate-300'}
                  ${isActive ? 'bg-primary animate-pulse' : ''}
                `}
              >
                {isCompleted && (
                  <svg className="w-3 h-3 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                  </svg>
                )}
              </span>
              <h3 className={`font-bold ${isActive || isCompleted ? 'text-primary' : 'text-slate-500'}`}>{status}</h3>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Timeline;
