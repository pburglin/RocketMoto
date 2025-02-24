import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Github, Trophy } from 'lucide-react';
import { AddToHomescreen } from './AddToHomescreen';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h3>
            <p className="text-gray-600 dark:text-gray-300">
              RocketMoto.US helps motorcycle enthusiasts discover and share the best riding routes across the United States.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/faq"
                  onClick={() => window.scrollTo(0, 0)}
                  className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                >
                  <HelpCircle className="h-5 w-5 mr-2" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboards"
                  className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  Leaderboards
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/pburglin/RocketMoto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                >
                  <Github className="h-5 w-5 mr-2" />
                  GitHub
                </a>
                <AddToHomescreen className="mt-2" />
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
            <div className="space-y-2">
              <Link
                to="/terms"
                onClick={() => window.scrollTo(0, 0)}
                className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 block"
              >
                Terms of Service
              </Link>
              <p className="text-gray-600 dark:text-gray-300">
                © {currentYear} RocketMoto.US. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}