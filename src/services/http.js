import axios from 'axios';
import { toast } from 'react-toastify';

// 创建 axios 实例
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 处理成功响应
    if (response.data) {
      // 如果响应包含成功消息，显示提示
      if (response.data.message) {
        toast.success(response.data.message);
      }
      // 如果响应包含token，自动设置
      if (response.data.token) {
        setAuthToken(response.data.token);
      }
    }
    return response;
  },
  (error) => {
    console.error('Response error:', error);

    // 处理错误响应
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          toast.error(data.message || 'Invalid request');
          break;
        case 401:
          // 未授权，清除本地存储的 token
          localStorage.removeItem('token');
          toast.error('Please log in to continue');
          // 可以在这里添加重定向到登录页的逻辑
          break;
        case 403:
          toast.error('Access denied');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 409:
          toast.error(data.message || 'Conflict occurred');
          break;
        case 422:
          // 处理验证错误
          if (data.errors) {
            Object.values(data.errors).forEach(error => {
              toast.error(error);
            });
          } else {
            toast.error(data.message || 'Validation failed');
          }
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error('An unexpected error occurred');
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      toast.error('No response from server. Please check your connection.');
    } else {
      // 请求设置时发生错误
      toast.error('Error setting up request');
    }

    return Promise.reject(error);
  }
);

// Token 管理函数
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
  delete http.defaults.headers.common['Authorization'];
};

// 导出实例
export default http;
