'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLogin } from '@/hooks/queries/useAuth'; // 👈 Import the hook
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // 1. Initialize the hook
  const login = useLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 2. Use the hook instead of axios.post('http://localhost:8000...')
    login.mutate({ username, password });
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

          {/* Error Display */}
          {login.isError && (
            <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm text-center border border-red-100">
              {(login.error as any)?.response?.data?.detail || "Invalid username or password"}
            </div>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full flex justify-center items-center gap-2 rounded-md bg-black py-2.5 text-white font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-50"
          >
            {login.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-black hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}