import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, checkAuth } from '../services/authApi';
import { toast } from 'react-toastify';
import http from '../services/http';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 检查用户是否已经登录
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found');
          setLoading(false);
          return;
        }

        // 设置 axios 默认 header
        http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('Checking auth status...');
        const response = await checkAuth();
        const userData = response.data?.user || response.data;
        
        if (userData) {
          console.log('User authenticated:', userData);
          setUser(userData);
        } else {
          console.error('Invalid user data received:', response.data);
          throw new Error('Invalid user data');
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // 清除无效的认证信息
        localStorage.removeItem('token');
        delete http.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    console.log('Initializing auth...');
    initializeAuth();

    return () => {
      // 清理函数
      setLoading(true); // 重置加载状态
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      console.log('Attempting login with credentials:', { email: credentials.email });
      const response = await apiLogin(credentials);
      
      // apiLogin已经验证了响应格式并返回了正确的结构
      const { user, token } = response;
      console.log('Login successful:', { user: { ...user, password: undefined }, token: token?.slice(0, 10) + '...' });
      
      // 保存token
      localStorage.setItem('token', token);
      
      // 设置请求头
      http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 设置用户状态
      setUser(user);
      
      toast.success('登录成功！');
      return { user, token };
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message);
      setUser(null);
      localStorage.removeItem('token');
      delete http.defaults.headers.common['Authorization'];
      toast.error(error.message || '登录失败，请重试');
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    try {
      const response = await apiRegister(userData);
      if (response.data) {
        const { token } = response.data;
        setUser(response.data.user || userData);
        localStorage.setItem('token', token);
        toast.success('Successfully registered!');
        return response;
      }
      throw new Error('Registration failed: Invalid response format');
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Failed to register');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
      // 清除用户状态
      setUser(null);
      // 清除本地存储
      localStorage.removeItem('token');
      // 清除 HTTP 请求头
      delete http.defaults.headers.common['Authorization'];
      // 显示成功消息
      toast.success('已成功登出');
    } catch (error) {
      console.error('Logout failed:', error);
      // 即使 API 调用失败，也要清除本地状态
      setUser(null);
      localStorage.removeItem('token');
      delete http.defaults.headers.common['Authorization'];
      toast.error('登出时发生错误，但已清除本地登录状态');
    }
  }, []);

  const updateUserProfile = useCallback((updatedProfile) => {
    setUser(prev => ({
      ...prev,
      ...updatedProfile
    }));
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUserProfile
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
