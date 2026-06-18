import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/utils/api';
import type { LoginData, RegisterData } from '@/types';

export const useAuth = () => {
  const { user, token, isLoggedIn, login, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: LoginData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.login(data);
      login(result.user, result.token);
      localStorage.setItem('token', result.token);
      return result;
    } catch (err) {
      setError('登录失败，请检查邮箱和密码');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authAPI.register(data);
      login(result.user, result.token);
      localStorage.setItem('token', result.token);
      return result;
    } catch (err) {
      setError('注册失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
    } finally {
      logout();
      localStorage.removeItem('token');
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      authAPI.getProfile()
        .then(user => login(user, savedToken))
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  return {
    user,
    token,
    isLoggedIn,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
};
