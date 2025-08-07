import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleAccount {
  name: string;
  email: string;
  picture: string;
}

interface GoogleAccountDetectorProps {
  onClose: () => void;
}

export const GoogleAccountDetector: React.FC<GoogleAccountDetectorProps> = ({ onClose }) => {
  const [detectedAccount, setDetectedAccount] = useState<GoogleAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  useEffect(() => {
    const initializeGoogleIdentity = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            // This callback is for actual sign-in, we'll use it later
          },
          auto_select: false,
        });

        // Try to detect if user has Google accounts
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // No Google account detected or user dismissed
            return;
          }
          
          // If we get here, there might be a Google account available
          // Note: Due to privacy restrictions, we can't actually get account details
          // without user interaction, so we'll just show a generic prompt
          setDetectedAccount({
            name: 'Cuenta de Google',
            email: 'Cuenta disponible',
            picture: ''
          });
        });
      }
    };

    // Wait for Google script to load
    const checkGoogleLoaded = () => {
      if (window.google?.accounts?.id) {
        initializeGoogleIdentity();
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!detectedAccount) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Cuenta de Google detectada
            </p>
            <p className="text-xs text-gray-500 truncate">
              Iniciar sesión rápidamente
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="mt-3 flex space-x-2">
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Iniciando...' : 'Iniciar sesión'}
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
};