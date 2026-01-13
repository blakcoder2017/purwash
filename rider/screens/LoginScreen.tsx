
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { riderApi } from '../services/api';

const LoginScreen: React.FC = () => {
  const { login } = useAppContext();
  const [isLogin, setIsLogin] = useState(true); // true for login, false for register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await riderApi.login(email, password);
        if (response.success) {
          login(response.data.user, response.data.token);
        } else {
          setError(response.message || 'Login failed');
        }
      } else {
        const response = await riderApi.register({
          email,
          password,
          role: 'rider',
          profile: {
            firstName,
            lastName,
            phone
          }
        });
        if (response.success) {
          login(response.data.user, response.data.token);
        } else {
          setError(response.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-4 text-lg border-2 border-gray-300 rounded-md focus:outline-none focus:border-primary";
  const buttonClasses = "w-full p-4 bg-primary text-white font-bold text-lg rounded-md active:scale-95 transition-transform disabled:bg-gray-400";

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold text-white mb-2">weWash</h1>
        <p className="text-lg text-gray-300 mb-8">Rider Portal</p>

        <div className="bg-white p-6 rounded-lg shadow-2xl">
          <div className="flex mb-4">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 p-2 ${isLogin ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'} rounded-l-md`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 p-2 ${!isLogin ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'} rounded-r-md`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {isLogin ? 'Login' : 'Register'}
            </h2>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              required
            />

            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClasses}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClasses}
                  required
                />
                <div className="relative">
                  <span className="absolute left-3 top-4 text-lg text-gray-500">+233</span>
                  <input
                    type="tel"
                    placeholder="Phone (e.g., 541234567)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${inputClasses} pl-16`}
                    maxLength={9}
                    required
                  />
                </div>
              </>
            )}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              required
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className={buttonClasses}>
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
