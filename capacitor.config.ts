import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.sahayak.app',
  appName: 'Sahayak',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHttp: { enabled: true },
    StatusBar: { overlaysWebView: false },
  },
};

export default config;
