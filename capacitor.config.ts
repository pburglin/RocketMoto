import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'us.rocketmoto.routeexplorer',
  appName: 'motorcycle-route-explorer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always', // Ensure content is always within safe area
    variables: {
      '--ion-safe-area-top': '40px', // Adjust this value as needed
    }
  }
};

export default config;
