import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  title?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  showSidebar = false,
  title,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (showSidebar) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="flex">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </div>
          )}

          {/* Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-shrink-0`}
          >
            <Sidebar />
          </div>

          {/* Main content */}
          <div className="flex flex-col w-0 flex-1 overflow-hidden">
            {/* Mobile menu button */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-500 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                {title && <h1 className="text-lg font-medium text-gray-900">{title}</h1>}
              </div>
            </div>

            {/* Page content */}
            <main className="flex-1 relative overflow-y-auto focus:outline-none">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {title && (
                    <div className="hidden lg:block mb-8">
                      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    </div>
                  )}
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};