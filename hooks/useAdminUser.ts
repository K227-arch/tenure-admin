'use client'

import { useState, useEffect } from 'react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isOnline: boolean;
}

export function useAdminUser() {
  const [adminUser, setAdminUser] = useState<AdminUser>({
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@tenure.com',
    role: 'Super Admin',
    isOnline: true,
  });

  // In a real app, you would fetch this from your auth system
  useEffect(() => {
    // Simulate fetching admin user data
    const fetchAdminUser = async () => {
      try {
        // This would be replaced with actual API call to get current admin user
        // const response = await fetch('/api/auth/me');
        // const userData = await response.json();
        
        // For now, we'll use mock data
        setAdminUser({
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@tenure.com',
          role: 'Super Admin',
          isOnline: true,
        });
      } catch (error) {
        console.error('Failed to fetch admin user:', error);
      }
    };

    fetchAdminUser();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear client-side token
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if API fails
      window.location.href = '/login';
    }
  };

  return {
    adminUser,
    logout,
  };
}