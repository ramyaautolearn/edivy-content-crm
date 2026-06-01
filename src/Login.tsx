import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(() => {
      setError('Invalid email or password. Please try again.');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Content CRM
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Sign in to access your workspace
        </p>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4 text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@edivy.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
