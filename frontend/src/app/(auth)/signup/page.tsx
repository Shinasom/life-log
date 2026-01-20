'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRegister } from '@/hooks/queries/useAuth';
import { Loader2, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const register = useRegister();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Start tracking your life consistently.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          
          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Username</label>
            <input 
              type="text" 
              required
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="johndoe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Error Message */}
          {register.isError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {(register.error as any)?.response?.data?.username?.[0] || 
               (register.error as any)?.response?.data?.email?.[0] || 
               "Registration failed. Please try again."}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={register.isPending}
            className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {register.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Sign Up <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-black hover:underline">
                Log in
              </Link>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}