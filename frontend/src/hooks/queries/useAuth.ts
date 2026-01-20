import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // 👈 Import this
import api from '@/lib/api';

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post('/auth/login/', credentials);
      return data;
    },
    onSuccess: (data) => {
      // 1. Keep your existing LocalStorage logic (for API calls)
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);

      // 2. ✅ ADD THIS: Set Cookie (For Middleware navigation)
      // The middleware needs this to know you are logged in
      Cookies.set('accessToken', data.access, { expires: 7, path: '/' });

      // 3. Update React Query cache if you store user data there
      queryClient.setQueryData(['user'], data.user);

      // 4. Redirect
      router.push('/'); 
    },
    onError: (error) => {
      console.error("Login failed:", error);
    }
  });
};

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    // 1. Clear LocalStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // 2. ✅ ADD THIS: Remove Cookie
    Cookies.remove('accessToken', { path: '/' });
    
    // 3. Clear Cache
    queryClient.clear();
    
    // 4. Redirect
    router.push('login');
  };
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: any) => {
      // This sends the POST request to your Django registration endpoint
      // Ensure your backend has a path for '/auth/register/'
      const response = await api.post('/auth/register/', userData);
      return response.data;
    },
  });
};