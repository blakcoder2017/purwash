
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen bg-primary text-background flex flex-col font-sans">
      {/* Header with user menu */}
      <header className="p-4 flex justify-between items-center">
        <div className="text-xl font-bold">weWash</div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, {user.profile.firstName || user.email}</span>
            <button
              onClick={logout}
              className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-4">
          Laundry day,
          <br />
          without the stress.
        </h1>
        <p className="max-w-md text-lg text-slate-300 mb-12">
          We pick it up. Wash it. Deliver it back.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <Link
            to="/create"
            className="w-full bg-background text-primary font-bold py-4 px-6 rounded-2xl h-[56px] flex items-center justify-center text-lg active:scale-95 transition-transform"
          >
            Get Started
          </Link>
          <Link
            to="/track"
            className="w-full bg-primary text-background border-2 border-slate-500 font-bold py-4 px-6 rounded-2xl h-[56px] flex items-center justify-center text-lg active:scale-95 transition-transform"
          >
            Track your order
          </Link>
        </div>
      </main>
      <footer className="w-full text-center p-6 text-sm text-slate-400">
        <p>Pay with MoMo | Tracked Delivery</p>
      </footer>
    </div>
  );
};

export default HomePage;
