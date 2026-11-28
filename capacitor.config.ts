import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.andararejomakmur.devsalesos',
  appName: 'Developer Sales OS',
  webDir: 'dist',
  server: {
    url: 'https://developerproperti.giivepro.com',
    cleartext: false,
    allowNavigation: [
      'developerproperti.giivepro.com',
      '*.midtrans.com',
      '*.sandbox.midtrans.com',
      'wa.me',
      'api.whatsapp.com',
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
