import React from 'react';
import { Navigation as NavigationIcon, Map, Search, ThumbsUp, Camera, Tag, AlertTriangle } from 'lucide-react';

export function FAQ() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-600 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Location Access Required</h3>
            <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
              This app requires location access to provide the best experience. Without location permissions:
              <ul className="mt-2 list-disc list-inside">
                <li>Route distances from your location cannot be calculated</li>
                <li>Navigation to route start/end points will be less accurate</li>
                <li>Nearby route recommendations will not be available</li>
                <li>Route search results cannot be sorted by distance</li>
              </ul>
            </p>
            <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
              Please enable location access in your browser settings to use all features.
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Finding Great Routes</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start mb-4">
                <Search className="h-6 w-6 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">How do I find routes near me?</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    1. Click the "Use my current location" button on the home page<br />
                    2. Browse the map to see nearby routes<br />
                    3. Use the search page to filter by distance, tags, and more<br />
                    4. Routes are color-coded on the map - brighter routes are more popular
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start mb-4">
                <Tag className="h-6 w-6 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">What do the route tags mean?</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Routes are tagged with key characteristics:
                  </p>
                  <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• <strong>Scenic</strong> - Beautiful views and landscapes</li>
                    <li>• <strong>Curves</strong> - Twisty roads perfect for motorcycles</li>
                    <li>• <strong>Mountain</strong> - Mountain passes and elevation changes</li>
                    <li>• <strong>Coastal</strong> - Routes along the coastline</li>
                    <li>• <strong>Forest</strong> - Routes through forested areas</li>
                    <li>• <strong>Desert</strong> - Desert landscapes and open roads</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Taking Routes</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start mb-4">
                <NavigationIcon className="h-6 w-6 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">How do I navigate a route?</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    1. Open the route details page<br />
                    2. Click either "Navigate to Start" or "Navigate to End"<br />
                    3. The app will open Google Maps with turn-by-turn directions<br />
                    4. Your current location will be used as the starting point
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start mb-4">
                <ThumbsUp className="h-6 w-6 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">How can I rate and review routes?</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    After creating an account, you can:
                  </p>
                  <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Give routes a thumbs up or down</li>
                    <li>• Leave detailed comments about your experience</li>
                    <li>• Share tips about road conditions or points of interest</li>
                    <li>• Help other riders by rating accuracy and enjoyment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Sharing Routes</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start mb-4">
                <Map className="h-6 w-6 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">How do I create a new route?</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    1. Sign in to your account<br />
                    2. Click the "+" icon in the navigation bar<br />
                    3. Set start and end points by:<br />
                    &nbsp;&nbsp;&nbsp;• Entering addresses<br />
                    &nbsp;&nbsp;&nbsp;• Entering coordinates<br />
                    &nbsp;&nbsp;&nbsp;• Clicking points on the map<br />
                    4. Add a title, description, and tags<br />
                    5. The route will automatically calculate distance and duration
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start mb-4">
                <Camera className="h-6 w-6 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">How can I add photos to my route?</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    After creating a route:
                  </p>
                  <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>1. Go to the route details page</li>
                    <li>2. Find the Photos section</li>
                    <li>3. Click "Add Photo"</li>
                    <li>4. Either:
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• Upload a photo from your device</li>
                        <li>• Add a photo URL</li>
                      </ul>
                    </li>
                    <li>5. Add an optional caption</li>
                    <li>6. Photos help other riders identify landmarks and conditions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-6">
          <h2 className="text-lg font-medium text-indigo-900 dark:text-indigo-100 mb-2">Need more help?</h2>
          <p className="text-indigo-700 dark:text-indigo-300">
            Have a question that's not answered here? Feel free to contact us or ask the community in the route comments.
          </p>
        </div>
      </div>
    </div>
  );
}