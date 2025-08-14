import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';
import { AuthModal, AuthMode } from '../components/auth/AuthModal';
import { UserProfile } from '../components/dashboard/UserProfile';

export const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [initialTab, setInitialTab] = useState<'profile' | 'password' | 'phone'>('profile');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'security') {
      setInitialTab('password');
    }
  }, [searchParams]);

  const openAuthModal = (mode: AuthMode) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <ResponsiveLayout title="Mi Perfil" onOpenAuth={openAuthModal}>
      <UserProfile initialTab={initialTab} />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialMode={authModalMode}
      />
    </ResponsiveLayout>
  );
};