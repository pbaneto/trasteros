import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import { toast } from 'react-toastify';
import { AuthModal, AuthMode } from '../auth/AuthModal';

interface HeaderProps {
  onOpenAuth?: (mode: AuthMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
      navigate(ROUTES.HOME);
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const openAuthModal = (mode: AuthMode) => {
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else {
      setAuthMode(mode);
      setIsAuthModalOpen(true);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Desktop User Menu or Auth Buttons */}
          <div className="hidden md:flex items-center justify-between w-full">
            <Link to={ROUTES.HOME} className="flex items-center hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center p-2">
                <img 
                  src="/images/file.svg" 
                  alt="Trasteros Logo" 
                  className="w-full h-full"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">Trasteros Las Rozas</span>
            </Link>
            
            {loading ? (
              /* Loading state */
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link 
                  to={ROUTES.DASHBOARD} 
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <span>{user.firstName}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Cerrar sesión"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l4-4m0 0l-4-4m4 4H9" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 transition-colors"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center justify-between w-full">
            <Link to={ROUTES.HOME} className="flex items-center hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center p-2">
                <img 
                  src="/images/file.svg" 
                  alt="Trasteros Logo" 
                  className="w-full h-full"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">Trasteros</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Link 
                    to={ROUTES.DASHBOARD} 
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Cerrar sesión"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l4-4m0 0l-4-4m4 4H9" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">

                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 transition-colors"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal - only render if not using external onOpenAuth */}
      {!onOpenAuth && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authMode}
        />
      )}
    </header>
  );
};