import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zerohunger.rider',
  appName: 'ZH Rider',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { useLegacyBridge: true },
  plugins: {
    CapacitorHttp: { enabled: true },
    CapacitorCookies: { enabled: true },
  },
};

export default config;