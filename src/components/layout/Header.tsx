import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const isHomePage = location.pathname === ROUTES.HOME;

  useEffect(() => {
    if (!isHomePage) {
      // On non-home pages, always show white header
      setIsScrolled(true);
      return;
    }
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      // Trigger a bit before hero text starts to appear behind header
      // Hero text is centered vertically, trigger earlier for smooth transition
      const triggerPoint = viewportHeight * 0.3; // 30% of viewport height
      setIsScrolled(scrollTop > triggerPoint);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

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
    <header className={`fixed top-0 left-0 right-0 transition-all duration-300 z-50 ${
      isScrolled || !isHomePage
        ? 'bg-white shadow-lg border-b border-gray-200' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Desktop User Menu or Auth Buttons */}
          <div className="hidden md:flex items-center justify-between w-full">
            <Link to={ROUTES.HOME} className="flex items-center hover:opacity-80 transition-opacity">
              <div className="w-14 h-14 bg-transparent rounded-lg flex items-center justify-center p-2.5">
                <img 
                  src="/images/file.svg" 
                  alt="Trasteros Logo" 
                  className="w-full h-full"
                  style={{ filter: (isScrolled || !isHomePage) ? 'brightness(0) saturate(100%) invert(27%) sepia(96%) saturate(5490%) hue-rotate(217deg) brightness(97%) contrast(98%)' : 'none' }}
                />
              </div>
              {/* <span className={`ml-3 text-lg font-semibold transition-colors ${
                (isScrolled || !isHomePage) ? 'text-gray-900' : 'text-white'
              }`}>Trasteros Las Rozas</span> */}
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
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
(isScrolled || !isHomePage)
                      ? 'text-gray-700 hover:bg-gray-100' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    (isScrolled || !isHomePage) ? 'bg-blue-100' : 'bg-white/20'
                  }`}>
                    <span className={`font-medium text-sm ${
                      (isScrolled || !isHomePage) ? 'text-blue-600' : 'text-white'
                    }`}>
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <span>{user.firstName}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`p-2 rounded-lg transition-colors ${
(isScrolled || !isHomePage)
                      ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:text-gray-200 hover:bg-white/10'
                  }`}
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
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
(isScrolled || !isHomePage)
                      ? 'text-gray-700 hover:text-blue-600'
                      : 'text-white hover:text-gray-200'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className={`font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors focus:ring-4 focus:outline-none ${
(isScrolled || !isHomePage)
                      ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 border border-blue-600'
                      : 'text-white bg-white/20 hover:bg-white/30 focus:ring-white/50 border border-white/30'
                  }`}
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center justify-between w-full">
            <Link to={ROUTES.HOME} className="flex items-center hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-transparent rounded-lg flex items-center justify-center p-2.5">
                <img 
                  src="/images/file.svg" 
                  alt="Trasteros Logo" 
                  className="w-full h-full"
                  style={{ filter: (isScrolled || !isHomePage) ? 'brightness(0) saturate(100%) invert(27%) sepia(96%) saturate(5490%) hue-rotate(217deg) brightness(97%) contrast(98%)' : 'none' }}
                />
              </div>
              {/* <span className={`ml-2 text-base font-semibold transition-colors ${
                (isScrolled || !isHomePage) ? 'text-gray-900' : 'text-white'
              }`}>Trasteros</span> */}
            </Link>
            
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Link 
                    to={ROUTES.DASHBOARD} 
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
(isScrolled || !isHomePage)
                        ? 'text-gray-700 hover:bg-gray-100' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      (isScrolled || !isHomePage) ? 'bg-blue-100' : 'bg-white/20'
                    }`}>
                      <span className={`font-medium text-sm ${
                        (isScrolled || !isHomePage) ? 'text-blue-600' : 'text-white'
                      }`}>
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className={`p-2 rounded-lg transition-colors ${
(isScrolled || !isHomePage)
                        ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        : 'text-white hover:text-gray-200 hover:bg-white/10'
                    }`}
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
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
(isScrolled || !isHomePage)
                        ? 'text-gray-700 hover:text-blue-600'
                        : 'text-white hover:text-gray-200'
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className={`font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors focus:ring-4 focus:outline-none ${
(isScrolled || !isHomePage)
                        ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 border border-blue-600'
                        : 'text-white bg-white/20 hover:bg-white/30 focus:ring-white/50 border border-white/30'
                    }`}
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