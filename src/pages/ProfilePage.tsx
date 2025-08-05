import React from 'react';
import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';
import { UserProfile } from '../components/dashboard/UserProfile';

export const ProfilePage: React.FC = () => {
  return (
    <ResponsiveLayout showSidebar title="Mi Perfil">
      <UserProfile />
    </ResponsiveLayout>
  );
};