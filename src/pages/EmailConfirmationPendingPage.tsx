import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { EmailConfirmationPending } from '../components/auth/EmailConfirmationPending';
import { ROUTES } from '../utils/constants';

export const EmailConfirmationPendingPage: React.FC = () => {
  const location = useLocation();
  const email = location.state?.email;

  // If no email in state, redirect to home page
  if (!email) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <EmailConfirmationPending email={email} />;
};