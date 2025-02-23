import React from 'react';
import { Navigation as NavigationIcon, Map, Search, ThumbsUp, Camera, Tag, AlertTriangle, Flag } from 'lucide-react';

export function FAQ() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Safety First</h3>
            <p className="mt-2 text-sm text-red-700 dark:text-red-200">
              Always prioritize road safety over navigation. Never operate your phone while riding.
              Use proper motorcycle communication equipment and keep your eyes on the road at all times.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-600 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Location Access Recommended</h3>
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
              You are not required to, but if you want any of these features please enable location access in your browser settings.
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
                    <li>• <strong>Street</strong> - Perfect routes for street bikes, suited for urban adventures</li>
                    <li>• <strong>Dirt</strong> - Ideal for dual-sport or adventure bikes tackling rugged terrains</li>
                    <li>• <strong>Touring</strong> - Longer journeys, best enjoyed on comfortable touring bikes</li>
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
                    2. Before starting:<br />
                    &nbsp;&nbsp;&nbsp;• Ensure your helmet has Bluetooth speakers or a proper communication system<br />
                    &nbsp;&nbsp;&nbsp;• Set up audio navigation before riding<br />
                    &nbsp;&nbsp;&nbsp;• Review the route overview and key turns<br />
                    3. Click either "Navigate to Start Point" or "Navigate to End Point"<br />
                    4. The app will open Google Maps with turn-by-turn directions<br />
                    5. Your current location will be used as the starting point<br />
                    6. Safety tips:<br />
                    &nbsp;&nbsp;&nbsp;• Never look at your phone while riding<br />
                    &nbsp;&nbsp;&nbsp;• Listen to audio directions through your helmet<br />
                    &nbsp;&nbsp;&nbsp;• Pull over safely if you need to check the route<br />
                    &nbsp;&nbsp;&nbsp;• Always prioritize road safety over following navigation directions
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
                    <br />
                  </p>
                  <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Rate routes with a thumbs up or down</li>
                    <li>• Leave comments about your experience with the routes</li>
                    <li>• Share tips about road conditions or points of interest</li>
                    <li>• Help other riders by sharing updated information about the routes</li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Remember to always share content to promote the best riding experience for our community
                  </p>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    <br/>
                    <strong>Important Privacy Note:</strong> To protect your privacy, you should not include personal information in:
                  </p>
                  <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Your username or profile</li>
                    <li>• Comments or reviews</li>
                    <li>• Route descriptions</li>
                    <li>• Photo captions</li>
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
                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <strong>Privacy Tip:</strong> When creating routes, avoid using personal information in titles or descriptions.
                    Focus on describing the route characteristics, road conditions, and points of interest.
                  </div>
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
                    <li>6. Photos help other riders identify landmarks and route conditions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Reporting Content</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start mb-4">
                <Flag className="h-6 w-6 text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">How do I report inappropriate content?</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    We count on the community to help keep RocketMoto safe and enjoyable for everyone.
                    Please submit a report if you find incorrect information or anything that violates our terms of service.
                  </p>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    To report a route for administrative review:
                  </p>
                  <ul className="mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>1. Navigate to the route details page</li>
                    <li>2. Click the "Report Route" button near the route title</li>
                    <li>3. Select a reason for reporting</li>
                    <li>4. Add any additional details about your concern</li>
                    <li>5. Submit the report for review</li>
                  </ul>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Content that violates our <a href="https://rocketmoto.us/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">terms of service</a> will be removed.
                    Repeat violators will have their accounts suspended or removed.
                    </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-6">
          <h2 className="text-lg font-medium text-indigo-900 dark:text-indigo-100 mb-2">Need more help?</h2>
          <p className="text-indigo-700 dark:text-indigo-300">
            Have a question that's not answered here? Feel free to ask the community in the route comments. For bug reports or feature requests, please visit our <a href="https://github.com/pburglin/RocketMoto/issues" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-500 dark:hover:text-indigo-400">GitHub Issues page</a>.
          </p>
        </div>
      </div>
    </div>
  );
}