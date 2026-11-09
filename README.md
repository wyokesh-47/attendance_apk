# Attendance

A staff-only mobile prototype migrated from Flutter to React Native, Expo and
TypeScript. It uses fictional demo records and local device storage only.

## Run on an Android phone with Expo Go

### One-time setup

1. Install Node.js **24.3 or newer** (the current LTS release is recommended).
   npm is included with Node.
2. Install **Expo Go** from Google Play on the Android phone.
3. Keep the laptop and phone on the same Wi-Fi network. Guest networks, VPNs,
   or router client isolation can block local device connections.

> **Tamil:** Laptop மற்றும் Android phone இரண்டும் ஒரே Wi-Fi-ல் இருக்கட்டும்.
> Android phone-ல் Google Play வழியாக **Expo Go** install செய்யுங்கள்.
> Node.js 24.3 அல்லது புதிய பதிப்பு laptop-ல் இருக்க வேண்டும்.

### Install and start the preview

In PowerShell, open the project folder and install dependencies:

```powershell
cd D:\34\attendance_apk
npm install
```

Start the Expo Go development server over the local network:

```powershell
npm run start:lan
```

Expo prints a QR code and a development URL in the terminal. Open **Expo Go**
on Android, choose **Scan QR code**, and scan the code shown in the laptop
terminal. If Windows asks, allow Node.js access on **Private networks**. The
phone and laptop must remain on the same Wi-Fi while previewing.

> **Tamil:** PowerShell-ல் `npm install` ஒருமுறை run செய்யுங்கள். ஒவ்வொரு முறை
> preview தொடங்கும்போதும் `npm run start:lan` run செய்யுங்கள். Terminal-ல் வரும்
> QR code-ஐ Expo Go-வில் scan செய்யுங்கள். Firewall கேள்வி வந்தால் **Private
> networks**-க்கு மட்டும் அனுமதி கொடுங்கள்.

### Restart after shutting down the laptop

1. Reconnect both devices to the same Wi-Fi.
2. Open PowerShell in `D:\34\attendance_apk`.
3. Run `npm run start:lan` and scan the newly displayed QR code in Expo Go.

Keep the terminal open while using the app. Save a `.ts` or `.tsx` file to
preview UI changes with Expo Fast Refresh. Press `Ctrl+C` in the terminal to
stop the server.

If the QR code cannot connect, check Windows Firewall, confirm both devices
are on the same non-guest network, and turn off a VPN temporarily. The
development URL is local to the current network and can change when the server
restarts. No Flutter Web preview, Android Studio, Android SDK, or APK build is
needed for this workflow.

## Demo sign-in and functionality

The sign-in screen is pre-filled with the approved fictional demo account:

- Email: `staff@demo.edu`
- Password: `demo1234`

New staff registrations are stored locally as pending approval. This prototype
has no Principal dashboard or real authentication, so new registrations cannot
be approved in-app.

The app includes:

- Seven departments: B.C.A, B.Sc. CS, B.Sc. AIML, B.B.A, M.B.A, B.Com, and
  B.Com CA.
- First, Second, and Third Year for each department (21 classes).
- A deterministic fictional roster of 45–65 students per class; names begin
  with `Demo`, and register numbers contain `DEMO`.
- Five attendance hours, student search, and Present, Absent, OD, and Informed
  Leave statuses.
- Mark All Present, attendance review, simulated local submission receipts,
  submitted-record edit locking, and duplicate-submission protection.
- Staff profile and local demo registration.

Attendance and receipts are saved locally with AsyncStorage. They are not
college records and are not sent to a server. No real student data, Excel
imports, reports, production authentication, or Supabase integration is used.

## Development checks

```powershell
npm run typecheck
npm test
npx expo install --check
npx expo-doctor
```

## Project map

- `app/` — Expo Router screens and navigation
- `components/` — shared UI and reusable tiles
- `data/` — departments, class rosters, and fictional student generator
- `services/` — demo authentication and local attendance repository
- `types/` — attendance, classroom, receipt, and profile types
- `tests/` — demo-data, authentication, and attendance behavior checks
- `legacy_flutter_backup/` — preserved pre-migration Flutter project snapshot

The original Flutter files and the existing Android preview script remain in
the workspace. The backup was copied before the Expo migration; do not delete
it if the Flutter implementation may be needed later.

## Future scope — not implemented

The following requirements remain documented for a later management phase:

- Separate HOD and Principal dashboards, department-wise monitoring, live
  summaries, hour-wise reports, and pending staff submission lists.
- Management-only attendance editing and a management edit history visible for
  24 hours.
- Excel student-data import and Supabase integration.

This phase intentionally does not implement these management features or
generate real college reports.
