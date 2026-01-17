'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios'; // <--- Use direct axios, not our 'api' wrapper

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // 👇 We explicitly point to the correct Auth URL here
      const res = await axios.post('http://localhost:8000/api/auth/login/', { 
        username, 
        password 
      });
      
      // Save Token
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      
      // Redirect
      router.push('/today');
      
    } catch (err) {
      console.error(err);
      setError('Invalid username or password');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Life OS</h1>
          <p className="text-sm text-gray-500">Sign in to your daily system</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-black outline-none transition"
              autoFocus
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-black outline-none transition"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-black py-2.5 text-white font-medium hover:bg-gray-800 transition shadow-sm"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}