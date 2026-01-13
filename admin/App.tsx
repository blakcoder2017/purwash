import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Partners from './pages/Partners';
import Logs from './pages/Logs';

const App: React.FC = () => {
    // This check simulates the requirement that the app is only accessible 
    // if the admin secret key is present in the environment.
    const hasAdminSecret = process.env.VITE_ADMIN_SECRET_KEY || true; // Default to true for demo purposes

    if (!hasAdminSecret) {
        return (
            <div className="flex items-center justify-center h-screen bg-w-secondary-background">
                <div className="text-center p-8 bg-white rounded-xl shadow-md border border-slate-200">
                    <h1 className="text-2xl font-bold text-w-text-main mb-2">Access Denied</h1>
                    <p className="text-w-text-body">Admin secret key is not configured. Please contact your system administrator.</p>
                </div>
            </div>
        );
    }

    return (
        <HashRouter>
            <div className="flex h-screen bg-w-secondary-background text-w-text-body">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <TopNav />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/orders" element={<Orders />} />
                            <Route path="/partners" element={<Partners />} />
                            <Route path="/logs" element={<Logs />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </HashRouter>
    );
};

export default App;
