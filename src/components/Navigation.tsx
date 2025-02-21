import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Recycle as Motorcycle, Map, User, Plus, Bookmark, Download } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { useAuth } from '../lib/auth';

export function Navigation() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <Motorcycle className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">RocketMoto.US</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/search" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Map className="h-6 w-6" />
              </Link>
              <Link to="/bookmarks" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Bookmark className="h-6 w-6" />
              </Link>
              {user && (
                <Link to="/create" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <Plus className="h-6 w-6" />
                </Link>
              )}
              {user ? (
                <Link to="/profile" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <User className="h-6 w-6" />
                </Link>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <User className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}