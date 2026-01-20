'use client';

import { useState, useRef, useEffect } from 'react';
import { useLogout } from '@/hooks/queries/useAuth'; // Your existing logout hook
import { useQueryClient } from '@tanstack/react-query'; // To get user data
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TopBar() {
  const logout = useLogout(); // This is the function we created earlier
  const queryClient = useQueryClient();
  
  // Get user from cache (or you can use useAuthStore if you prefer)
  const user: any = queryClient.getQueryData(['user']); 
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  };

  return (
    // Fixed Header
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b z-50 px-4 max-w-md mx-auto flex items-center justify-between">
      
      {/* Branding */}
      <div className="font-bold text-xl tracking-tight flex items-center gap-2">
        <div className="h-6 w-6 bg-black rounded-full"></div>
        Life OS
      </div>

      {/* Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
        >
          {/* Avatar Circle */}
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
             {getInitials(user?.username || user?.email)}
          </div>
          
          {/* Chevron */}
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
            
            {/* User Info Header */}
            <div className="px-4 py-3 border-b bg-gray-50/50">
               <p className="text-sm font-bold text-gray-900 truncate">
                 {user?.username || 'User'}
               </p>
               <p className="text-xs text-gray-500 truncate">
                 {user?.email || 'No email'}
               </p>
            </div>

            {/* Menu Items */}
            <div className="p-1">
              {/* <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <User className="h-4 w-4 text-gray-400" />
                Profile
              </button>
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Settings className="h-4 w-4 text-gray-400" />
                Settings
              </button> */}
              
              {/* Sign Out */}
              <button 
                onClick={() => logout()} // 👈 Calls your hook
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

    </header>
  );
}