import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'eu.ginie.nwbuddy',
  appName: 'New World Buddy',
  webDir: 'dist/web',
  bundledWebRuntime: false,
  android: {
    path: 'apps/android',
    appendUserAgent: 'nw-buddy-android'
  },
  ios: {
    path: 'apps/ios',
    appendUserAgent: 'nw-buddy-ios',
    allowsLinkPreview: false
  },
}

export default config
