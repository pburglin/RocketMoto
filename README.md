# Motorcycle Route Explorer 🏍️

A modern web application for motorcycle enthusiasts to discover, share, and explore scenic routes. Built with React, TypeScript, and Supabase.

## Features

- 🗺️ Interactive route mapping with OpenStreetMap integration
- 📍 Create routes by clicking on the map or entering addresses
- 🏷️ Tag routes with categories (scenic, curves, mountain, etc.)
- 📸 Add photos to document route highlights
- 👍 Rate and comment on routes
- 🌓 Dark/Light theme support
- 📱 Responsive design for all devices
- 🔍 Advanced route search and filtering
- 📏 Support for both kilometers and miles
- 🧭 Direct navigation integration with Google Maps

## Tech Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Tailwind CSS
  - React Router v6
  - Leaflet & Leaflet Routing Machine
  - Lucide React Icons

- **Backend:**
  - Supabase (PostgreSQL + PostGIS)
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Secure authentication

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/motorcycle-route-explorer.git
   cd motorcycle-route-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your Supabase credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following main tables:

- `users` - User profiles and preferences
- `routes` - Route details with PostGIS geometry
- `route_tags` - Tags associated with routes
- `route_photos` - Photos attached to routes
- `route_ratings` - User ratings for routes
- `route_comments` - User comments on routes

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenStreetMap for map data
- Leaflet for map visualization
- Supabase for backend infrastructure

## Publishing to App Stores

This guide outlines the steps to publish your Motorcycle Route Explorer app to the iOS App Store and Google Play Store.

### iOS App Store

1.  **Prerequisites:**
    - An Apple Developer Account.
    - Xcode installed and configured.
    - An iOS device or simulator for testing.

2.  **Build for Production:**
    ```bash
    npm run build
    ```

3.  **Sync Capacitor:**
    ```bash
    npx cap sync ios
    ```

4.  **Open Xcode:**
    ```bash
    npx cap open ios
    ```

5.  **Configure Xcode:**
    - In Xcode, open `App` -> `Signing & Capabilities`.
    - Ensure your Apple Developer account is selected.
    - Configure signing certificates and provisioning profiles.
    - Update the bundle identifier if necessary.

6.  **Build and Archive:**
    - Select "Generic iOS Device" as the build target.
    - Go to `Product` -> `Archive`.

7.  **Distribute App:**
    - Once archiving is complete, the Organizer window will appear.
    - Click "Distribute App".
    - Choose "App Store Connect" as the distribution method.
    - Follow the prompts to upload your app to App Store Connect.

8.  **App Store Connect:**
    - Log in to [App Store Connect](https://appstoreconnect.apple.com).
    - Create a new app and fill in the required metadata (name, description, screenshots, etc.).
    - Submit your build for review.

### Google Play Store

1.  **Prerequisites:**
    - A Google Play Developer Account.
    - Android Studio installed and configured.
    - An Android device or emulator for testing.

2.  **Build for Production:**
    ```bash
    npm run build
    ```

3.  **Sync Capacitor:**
    ```bash
    npx cap sync android
    ```

4.  **Open Android Studio:**
    ```bash
    npx cap open android
    ```

5.  **Configure Android Studio:**
    - In Android Studio, open `app` -> `AndroidManifest.xml`.
    - Update the package name if necessary (should match your app ID).
    - Configure signing settings in `app` -> `build.gradle` or using Android Studio's signing tools.

6.  **Generate Signed APK or Bundle:**
    - Go to `Build` -> `Generate Signed Bundle / APK`.
    - Choose "Android App Bundle" (recommended) or "APK".
    - Follow the prompts to create a signed bundle or APK.

7.  **Google Play Console:**
    - Log in to [Google Play Console](https://play.google.com/console).
    - Create a new app and fill in the required store listing details (name, description, screenshots, etc.).
    - Upload your signed APK or bundle to the Play Console.
    - Configure pricing and distribution settings.
    - Submit your app for review.

### Content Updates

Content updates (like routes, comments, etc.) are managed through your web app's backend (Supabase in this case). Since the mobile apps are essentially web apps wrapped in Capacitor, they will automatically reflect any changes made to the web app's content as long as they are connected to the internet.

You don't need any special steps to sync content updates between the web app and mobile apps. Just deploy your web app updates as usual, and the mobile apps will display the latest content when users open them.