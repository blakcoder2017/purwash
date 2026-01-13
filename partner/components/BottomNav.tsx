import React from 'react';
import { View } from '../types';

interface BottomNavProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const DashboardIcon = ({ isActive }: { isActive: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-slate-400'}`}>
        <path fillRule="evenodd" d="M4.5 2.25a.75.75 0 000 1.5v16.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5V3.75a.75.75 0 000-1.5h-15zM5.25 3.75h13.5v16.5H5.25V3.75zM8.25 6a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5A.75.75 0 008.25 6zm3.75 0a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5a.75.75 0 00-.75-.75zm3.75 0a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5a.75.75 0 00-.75-.75zM8.25 10.5a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5a.75.75 0 00-.75-.75zm3.75 0a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5a.75.75 0 00-.75-.75zm3.75 0a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
    </svg>
);

const WalletIcon = ({ isActive }: { isActive: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-slate-400'}`}>
        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v1.25A9.786 9.786 0 003 8.25c0 2.879.992 5.545 2.671 7.622.33.356.72.684 1.143.984a.75.75 0 00.916-.046l.012-.009a18.332 18.332 0 0111.488 0l.012.009a.75.75 0 00.916.046c.423-.3.813-.628 1.143-.984C20.008 13.795 21 11.129 21 8.25a9.786 9.786 0 00-.75-3.432V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v-.025a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v.025z" />
        <path fillRule="evenodd" d="M12 21a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm-1.5 0a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm-1.5 0a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm-1.5 0a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm8.24-.748a.75.75 0 00.528-.944l-.286-1.07a.75.75 0 00-1.42.378l.286 1.07a.75.75 0 00.892.572zM18 21a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm1.5 0a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm-12.75-.75a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21a.75.75 0 01.75-.75h.01zM4.53 18.272a.75.75 0 00.892-.573l.286-1.07a.75.75 0 00-1.42-.378l-.286 1.07a.75.75 0 00.528.944z" clipRule="evenodd" />
    </svg>
);


const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
    const navItems = [
        { view: View.Dashboard, label: 'Dashboard', icon: DashboardIcon },
        { view: View.Earnings, label: 'Earnings', icon: WalletIcon },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-t-lg">
            <div className="flex justify-around max-w-md mx-auto">
                {navItems.map(item => {
                    const isActive = currentView === item.view;
                    return (
                        <button
                            key={item.view}
                            onClick={() => setCurrentView(item.view)}
                            className="flex-1 flex flex-col items-center justify-center py-2 px-4 transition-colors duration-200"
                        >
                            <item.icon isActive={isActive} />
                            <span className={`text-xs mt-1 font-bold ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                                {item.label}
                            </span>
                             {isActive && <div className="w-8 h-1 bg-primary rounded-full mt-1"></div>}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
