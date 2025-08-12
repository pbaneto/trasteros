import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { PasswordReset } from './PasswordReset';

export type AuthMode = 'login' | 'register' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const handleClose = () => {
    setMode('login'); // Reset to login when closing
    onClose();
  };

  const renderAuthForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm 
            onSwitchToRegister={() => setMode('register')}
            onSwitchToReset={() => setMode('reset')}
            onSuccess={handleClose}
          />
        );
      case 'register':
        return (
          <RegisterForm 
            onSwitchToLogin={() => setMode('login')}
            onSuccess={handleClose}
          />
        );
      case 'reset':
        return (
          <PasswordReset 
            onSwitchToLogin={() => setMode('login')}
          />
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      {renderAuthForm()}
    </Modal>
  );
};