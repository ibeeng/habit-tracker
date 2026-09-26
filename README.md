# Rootine

Habit tracker terminal-style — PWA + Android (Capacitor). Ikon: lucide Sprout (ISC).

**Live (web/PWA):** https://ibeeng.github.io/habit-tracker/
**Android:** `npm run android:apk` → `android/app/build/outputs/apk/release/app-release.apk`

## Stack
React 19 · Vite 6 · TypeScript · Tailwind 4 · localStorage · Google Sign-In (GIS web · Play Services native di Android) · Capacitor 8

## Setup (login Google)
1. Buat **OAuth Client ID (Web)** di [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
2. Authorized JavaScript origins:
   - dev: `http://localhost:3001`
   - prod: `https://ibeeng.github.io`
   - android app: `https://localhost` ← Capacitor menyajikan web assets dari origin ini
3. Local: copy `.env.example` → `.env`, isi `VITE_GOOGLE_CLIENT_ID`
4. GitHub: set repo secret `VITE_GOOGLE_CLIENT_ID` (Settings → Secrets → Actions)

## Run
```bash
npm install
npm run dev           # http://localhost:3001/habit-tracker/
npm run build         # dist/ (base: /habit-tracker/) → buat web/PWA
```

## Android (Capacitor)
Kode yang sama, dua target: `base: '/habit-tracker/'` buat web, `base: './'` buat Android.

```bash
# sekali saja
npm run android:add            # cap add android
./scripts/android-keystore.sh  # buat signing key (BACK UP .keys/rootine-release.jks!)
python3 scripts/make-android-icons.py   # regenerate ikon + splash

# tiap mau rilis
npm run android:apk            # build web (base ./) + cap sync + assembleRelease
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Output APK: `android/app/build/outputs/apk/release/app-release.apk`

Catatan:
- `android/` dan `.keys` gitignored. `android/keystore.properties` dibuat oleh `scripts/android-keystore.sh`.
- System bar handled by Capacitor's `SystemBars` plugin (`capacitor.config.ts`): `style: 'DARK'` (icon putih) + `insetsHandling: 'native'`. Yang 'native' penting — WebView 140+ (HP baru) default-nya edge-to-edge danInsets harus dikompensasi di CSS per device, yang bikin bottom nav numpuk sama gesture bar HP.
- Service worker **dimatikan** di build Android (`VITE_NATIVE=1`) — asetnya udah di dalam APK, SW cuma nyajiin bundle basi.
- Data lokal (localStorage) terpisah antara browser dan app. Pindah data: export backup JSON di web → menu **import backup** di app.
- Butuh Android SDK: `ANDROID_HOME` + `android/local.properties` (`sdk.dir=...`), platform + build tools. JDK 21 (script `scripts/android-build.sh` cari otomatis di `~/jdk`).
- Naikkan `versionCode` di `android/app/build.gradle` tiap rilis (install update butuh versi naik).

### Login Google di Android

Google **menolak** consent screen di dalam WebView, jadi build Android tidak memakai
Google Identity Services di WebView. Login lewat **native Google Identity API**
(Play Services / Credential Manager) via plugin `@capgo/capacitor-social-login`
— cukup satu tap, dan choice sheet-nya muncul di atas app (nggakindah ke Chrome).

Butuh dua OAuth client di project Google Cloud yang sama:

| client | tipe | isian |
|---|---|---|
| untuk web | Web application | client ID ini → `.env` (`VITE_GOOGLE_CLIENT_ID`), dipakai sebagai audience `id_token` |
| untuk app | Android | package name `com.waalid.rootine`, SHA-1 `B9:6B:52:B2:67:1A:EE:C8:BB:16:AD:97:DE:16:90:9F:B3:DE:EF:26` |

Kalau client Android-nya nggak ada / SHA-1 atau package name-nya beda, Play Services
nolak login dengan `ApiException` (error merah di layar login).
Logika-nya ada di `src/lib/auth-native.ts`.




## Deploy (GitHub Pages / gh-pages branch)
```bash
npm run build
./scripts/deploy.sh
# or: bash scripts/deploy.sh
```

Push source ke `main`:
```bash
git push origin main
```
