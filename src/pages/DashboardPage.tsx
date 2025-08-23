import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ActiveUnitsTable } from '../components/dashboard/ActiveUnitsTable';
import { ReservationWizard } from '../components/storage/ReservationWizard';
import { UserProfile } from '../components/dashboard/UserProfile';
import { AuthModal, AuthMode } from '../components/auth/AuthModal';
import { Rental } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'trasteros' | 'perfil'>('trasteros');
  const [showReservationWizard, setShowReservationWizard] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [initialWizardSize, setInitialWizardSize] = useState<number | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const wizard = searchParams.get('wizard');
    const size = searchParams.get('size');
    const step = searchParams.get('step');
    
    if (tab === 'perfil') {
      setActiveTab('perfil');
    } else {
      setActiveTab('trasteros');
    }

    if (wizard === 'true') {
      setShowReservationWizard(true);
      if (size) {
        setInitialWizardSize(parseInt(size));
      }
      
      // Store step and canceled state for wizard
      if (step) {
        sessionStorage.setItem('wizardStep', step);
      }
      if (searchParams.get('canceled') === 'true') {
        sessionStorage.setItem('wizardCanceled', 'true');
      }
      
      // Remove wizard params from URL to clean it up
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('wizard');
      newSearchParams.delete('size');
      newSearchParams.delete('step');
      newSearchParams.delete('canceled');
      setSearchParams(newSearchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (tab: 'trasteros' | 'perfil') => {
    setActiveTab(tab);
    if (tab === 'perfil') {
      setSearchParams({ tab: 'perfil' });
    } else {
      setSearchParams({});
    }
    // Close reservation wizard if open when switching tabs
    if (showReservationWizard) {
      setShowReservationWizard(false);
      setInitialWizardSize(null);
    }
  };

  const handleCancelSubscription = (rental: Rental) => {
    // TODO: Implement subscription cancellation logic
    console.log('Cancel subscription for rental:', rental.id);
    // You can add a confirmation modal here
  };

  const openAuthModal = (mode: AuthMode) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <DashboardLayout>
      <Header onOpenAuth={openAuthModal} />
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:from-blue-700 dark:to-blue-800 overflow-hidden">
          <div className="px-5 py-3 sm:px-8 flex items-center justify-between min-h-[60px]">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white hidden md:block">
                ¡Hola, {user?.firstName}!
              </h1>
            </div>
            
            <div className="flex items-center space-x-8">
              <nav className="flex space-x-8">
                <button
                  onClick={() => handleTabChange('trasteros')}
                  className={`py-2 px-1 border-b-2 font-medium text-md transition-colors ${
                    activeTab === 'trasteros'
                      ? 'border-white text-white'
                      : 'border-transparent text-blue-200 hover:text-blue-100 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="hidden sm:inline">Mis Trasteros</span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTabChange('perfil')}
                  className={`py-2 px-1 border-b-2 font-medium text-md transition-colors ${
                    activeTab === 'perfil'
                      ? 'border-white text-white'
                      : 'border-transparent text-blue-200 hover:text-blue-100 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">Mi Perfil</span>
                  </div>
                </button>
              </nav>
              
              <button
                onClick={() => setShowReservationWizard(true)}
                className="text-blue-700 bg-white hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-100 dark:hover:bg-gray-200 dark:focus:ring-blue-800 transition-colors"
              >
                <span className="hidden sm:inline">Alquilar trastero</span>
                <span className="sm:hidden">Alquilar</span>
              </button>
            </div>
          </div>
        </div>
        {/* Reservation Wizard - Show regardless of active tab */}
        {showReservationWizard ? (
          <ReservationWizard 
            onClose={() => {
              setShowReservationWizard(false);
              setInitialWizardSize(null);
            }} 
            initialSize={initialWizardSize}
          />
        ) : (
          <>
            {/* Tab Content */}
            {activeTab === 'trasteros' && (
              <div className="space-y-8">
                {/* Units Table */}
                <ActiveUnitsTable
                  onCancelSubscription={handleCancelSubscription}
                />
              </div>
            )}

            {activeTab === 'perfil' && (
              <UserProfile initialTab={searchParams.get('profileTab') as any || 'profile'} />
            )}
          </>
        )}
      </div>
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialMode={authModalMode}
      />

    </DashboardLayout>
  );
};