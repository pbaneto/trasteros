import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ActiveUnitsTable } from '../components/dashboard/ActiveUnitsTable';
import { ContractRenewal } from '../components/dashboard/ContractRenewal';
import { UnitDetailsPanel } from '../components/storage/UnitDetailsPanel';
import { ReservationWizard } from '../components/storage/ReservationWizard';
import { UserProfile } from '../components/dashboard/UserProfile';
import { AuthModal, AuthMode } from '../components/auth/AuthModal';
import { Rental } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'trasteros' | 'perfil'>('trasteros');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showReservationWizard, setShowReservationWizard] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode] = useState<AuthMode>('login');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'perfil') {
      setActiveTab('perfil');
    } else {
      setActiveTab('trasteros');
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'trasteros' | 'perfil') => {
    setActiveTab(tab);
    if (tab === 'perfil') {
      setSearchParams({ tab: 'perfil' });
    } else {
      setSearchParams({});
    }
  };
    
  const handleViewAccess = (rental: Rental) => {
    setSelectedRental(rental);
    setShowDetailsPanel(true);
  };

  const handleRenewRental = (rental: Rental) => {
    setSelectedRental(rental);
    setShowRenewalModal(true);
  };

  const handleCancelSubscription = (rental: Rental) => {
    // TODO: Implement subscription cancellation logic
    console.log('Cancel subscription for rental:', rental.id);
    // You can add a confirmation modal here
  };


  const handleRenewalComplete = () => {
    // Refresh the units table - in a real app you might use a state management solution
    window.location.reload();
  };


  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="ml-4 mb-4 sm:mb-0">
                <h1 className="text-2xl font-bold text-white">
                  ¡Hola, {user?.firstName}!
                </h1>
                <p className="text-white">Gestiona tus trasteros alquilados y su estado.</p>
              </div>
              {activeTab === 'trasteros' && (
                <div className="ml-4 sm:mr-4">
                  <button
                    onClick={() => setShowReservationWizard(true)}
                    className="bg-white text-primary-600 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg shadow transition-colors w-full sm:w-auto"
                  >
                    Reservar trastero
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Tab Content */}
        {activeTab === 'trasteros' && (
          <>
            {!showReservationWizard ? (
              <div className="space-y-8">
                {/* Units Table */}
                <ActiveUnitsTable
                  onGenerateQR={handleViewAccess}
                  onRenewRental={handleRenewRental}
                  onCancelSubscription={handleCancelSubscription}
                />

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Acciones Rápidas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <a
                      href="tel:+34900000000"
                      className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          Soporte
                        </div>
                        <div className="text-xs text-gray-500">
                          900 000 000
                        </div>
                      </div>
                    </a>

                    <a
                      href="mailto:info@trasteros.com"
                      className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          Email
                        </div>
                        <div className="text-xs text-gray-500">
                          Contáctanos
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <ReservationWizard onClose={() => setShowReservationWizard(false)} />
            )}
          </>
        )}

        {activeTab === 'perfil' && (
          <UserProfile initialTab={searchParams.get('profileTab') as any || 'profile'} />
        )}
      </div>

      {/* Modals */}
      {selectedRental && (
        <ContractRenewal
          rental={selectedRental}
          isOpen={showRenewalModal}
          onClose={() => {
            setShowRenewalModal(false);
            setSelectedRental(null);
          }}
          onRenewalComplete={handleRenewalComplete}
        />
      )}

      {/* Details Panel - This could also be a modal */}
      {showDetailsPanel && selectedRental && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Detalles del Trastero
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetailsPanel(false);
                      setSelectedRental(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <UnitDetailsPanel
                  rental={selectedRental}
                  onRenew={() => setShowRenewalModal(true)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialMode={authModalMode}
      />

    </DashboardLayout>
  );
};