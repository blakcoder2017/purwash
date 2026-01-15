import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const LoginScreen: React.FC = () => {
    const { login } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            if (data.success) {
                login(data.data.user, data.data.token);
                window.location.href = '/dashboard';
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-4xl font-bold text-white mb-2">PurWash</h1>
                <p className="text-lg text-gray-300 mb-8">Partner Portal</p>

                <div className="bg-white p-6 rounded-lg shadow-2xl">
                    <h2 className="text-2xl font-bold text-primary mb-6">Login</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 text-lg border-2 border-gray-300 rounded-md focus:outline-none focus:border-primary"
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 text-lg border-2 border-gray-300 rounded-md focus:outline-none focus:border-primary"
                            required
                        />

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full p-4 bg-primary text-white font-bold text-lg rounded-md active:scale-95 transition-transform disabled:bg-gray-400"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            New to PurWash? Join our partner network
                        </p>
                        <Link 
                            to="/register" 
                            className="inline-block w-full p-4 bg-green-600 text-white font-bold text-lg rounded-md hover:bg-green-700 transition-colors text-center"
                        >
                            Register as Partner
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
