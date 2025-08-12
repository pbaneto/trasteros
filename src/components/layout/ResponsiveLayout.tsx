import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthMode } from '../auth/AuthModal';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  onOpenAuth?: (mode: AuthMode) => void;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  title,
  onOpenAuth,
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenAuth={onOpenAuth} />
      <main className="flex-1 bg-gray-50">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {title && (
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};