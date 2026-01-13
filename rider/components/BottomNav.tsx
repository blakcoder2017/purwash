
import React from 'react';
import { NavLink } from 'react-router-dom';
import { MissionIcon, WalletIcon, ProfileIcon } from './icons/NavIcons';

const BottomNav: React.FC = () => {
  const commonClasses = "flex flex-col items-center justify-center w-full h-full text-gray-500";
  const activeClasses = "text-primary font-bold";

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 shadow-lg flex justify-around">
      <NavLink 
        to="/mission" 
        className={({ isActive }) => `${commonClasses} ${isActive ? activeClasses : ''}`}
      >
        <MissionIcon />
        <span className="text-xs mt-1">Mission</span>
      </NavLink>
      <NavLink 
        to="/wallet" 
        className={({ isActive }) => `${commonClasses} ${isActive ? activeClasses : ''}`}
      >
        <WalletIcon />
        <span className="text-xs mt-1">Wallet</span>
      </NavLink>
      <NavLink 
        to="/profile" 
        className={({ isActive }) => `${commonClasses} ${isActive ? activeClasses : ''}`}
      >
        <ProfileIcon />
        <span className="text-xs mt-1">Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
