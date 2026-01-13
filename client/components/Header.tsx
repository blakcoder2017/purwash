
import React from 'react';

interface HeaderProps {
    title: string;
    onBack?: () => void;
}

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
    return (
        <header className="p-4 flex items-center bg-background sticky top-0 z-10">
            {onBack && (
                 <button onClick={onBack} className="p-2 mr-2 -ml-2 text-primary active:scale-95 transition-transform">
                    <BackIcon />
                </button>
            )}
            <h1 className="text-2xl font-bold text-primary">{title}</h1>
        </header>
    );
};

export default Header;
