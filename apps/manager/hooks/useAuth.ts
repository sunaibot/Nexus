import { useState, useEffect, useCallback } from 'react';
import {
  sessionAdminLogout,
  checkSessionAuthStatusAsync,
} from '../lib/session-auth';
import { isDemoMode } from '../lib/api';

export type PageType = 'home' | 'admin' | 'admin-login' | 'force-password-change';

export function useAuth() {
  const [currentPage, setCurrentPage] = useState<PageType>('admin');
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时异步检查登录状态
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // 先尝试从服务器验证 Session
        const { isValid, username } = await checkSessionAuthStatusAsync();
        if (isValid && username) {
          setIsLoggedIn(true);
          setAdminUsername(username);
        } else {
          // 服务器验证失败，清除本地状态
          setIsLoggedIn(false);
          setAdminUsername('');
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setIsLoggedIn(false);
        setAdminUsername('');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 检查是否已登录后台
  const checkAdminAuth = useCallback(async () => {
    const { isValid, username } = await checkSessionAuthStatusAsync();
    if (isValid && username) {
      setAdminUsername(username);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  }, []);

  // 后台登录成功
  const handleAdminLogin = useCallback((username: string, requirePasswordChange?: boolean) => {
    setAdminUsername(username);
    setIsLoggedIn(true);
    // 如果需要强制修改密码，跳转到密码修改页面（演示模式下跳过）
    if (requirePasswordChange && !isDemoMode()) {
      setCurrentPage('force-password-change');
    } else {
      setCurrentPage('admin');
    }
  }, []);

  // 密码修改成功后的处理
  const handlePasswordChangeSuccess = useCallback(() => {
    setCurrentPage('admin');
  }, []);

  // 后台退出登录
  const handleAdminLogout = useCallback(async () => {
    try {
      await sessionAdminLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdminUsername('');
      setIsLoggedIn(false);
      setCurrentPage('admin-login');
    }
  }, []);

  // 导航处理
  const navigateTo = useCallback((page: PageType) => {
    setCurrentPage(page);
  }, []);

  // 导航到管理页面（带权限检查）
  const navigateToAdmin = useCallback(async () => {
    const isAuth = await checkAdminAuth();
    if (isAuth) {
      setCurrentPage('admin');
    } else {
      setCurrentPage('admin-login');
    }
  }, [checkAdminAuth]);

  return {
    currentPage,
    adminUsername,
    isLoggedIn,
    isLoading,
    setCurrentPage: navigateTo,
    handleAdminLogin,
    handlePasswordChangeSuccess,
    handleAdminLogout,
    navigateToAdmin,
    checkAdminAuth,
  };
}
