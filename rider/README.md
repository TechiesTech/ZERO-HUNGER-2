# Zero Hunger — Rider Delivery Partner App

Mobile-first responsive web application built with **React 19**, **TypeScript**, and **Tailwind CSS v4**, designed specifically to be wrapped with **Capacitor** for Android APK distribution.

---

## 📱 Features

- **Mobile-first UI**: Designed specifically for one-handed smartphone operation outdoors in bright sunlight.
- **Large Touch Targets**: 48px+ action buttons reachable by thumb.
- **Top Bar**: Always-visible Online / Offline toggle bar with status indicator.
- **Map View**: Top half live map with Rider marker, Kitchen pickup pin, and Customer drop pin.
- **Fixed Bottom Sheet**: Active delivery controls stay mounted over the map.
- **Smart GPS Tracking**:
  - Sends location immediately when tapping **Go Online**.
  - Sends every 20 seconds while idle & online.
  - Sends every 5 seconds while on an active delivery.
  - Enforces rate limits (never exceeds 20 requests/minute).
- **Proof of Delivery Camera**: Integrated photo capture modal for doorstep delivery verification uploaded to Cloudinary.
- **Quick Links**: One-touch "Call Customer/Kitchen" and "Open in Google Maps".
- **Safety Blocks**: Blocks going offline or logging out during an active delivery.

---

## 🚀 Running in Development

```bash
# Inside rider directory
cd rider

# Install dependencies
npm install

# Start development server on port 5175
npm run dev
```

The app will be available at: `http://localhost:5175`

---

## 📦 Capacitor Android Wrapping Guide

Once tested in the mobile browser, wrap the app into a native Android APK using Capacitor:

### 1. Install Capacitor Dependencies
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor-community/background-geolocation
npx cap init "Zero Hunger Rider" com.zerohunger.rider --web-dir dist
```

### 2. Build Web Assets & Add Android
```bash
npm run build
npx cap add android
```

### 3. Configure Android Foreground Service & Geolocation
In `android/app/src/main/AndroidManifest.xml`, ensure the following permissions are present:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

### 4. Sync & Open Android Studio
```bash
npx cap sync
npx cap open android
```
From Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate the `.apk` file for testing on physical devices with screen locked.

