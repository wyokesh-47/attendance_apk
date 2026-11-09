# Campus attendance — staff demo

A staff-only Flutter prototype with fictional sample records. Every generated
student name begins with `Demo`, every register number contains `DEMO`, and
screens identify the roster as demo data.

## Run the Android app on your phone

> **Tamil:** இந்த app-ஐ phone-ல் நேரடியாக run செய்ய, முதலில் Android SDK மற்றும்
> Platform-Tools (ADB) தேவை. இந்த project-இல் அவை தானாக install செய்யப்படாது.

### One-time laptop setup

1. Install Android Studio from
   [developer.android.com/studio](https://developer.android.com/studio/).
   Android Studio is only being used to install Android development tools; the
   attendance app still runs directly on your phone.
2. Open Android Studio's **SDK Manager** and install:
   - Android SDK Platform (a current stable API level)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools (**includes ADB**)
   - Android SDK Command-line Tools (latest)
3. Use the Android Studio bundled JDK. A separate Java install is usually not
   needed when Android Studio supplies its JDK.
4. The usual SDK folder is
   `%LOCALAPPDATA%\Android\Sdk`. In PowerShell, configure Flutter with:

   ```powershell
   & "D:\tools\flutter\bin\flutter.bat" config --android-sdk "$env:LOCALAPPDATA\Android\Sdk"
   & "D:\tools\flutter\bin\flutter.bat" doctor --android-licenses
   & "D:\tools\flutter\bin\flutter.bat" doctor -v
   ```

   Accept the Android SDK licences. If your SDK is in another folder, use that
   folder instead of `%LOCALAPPDATA%\Android\Sdk`.
5. If `adb` is not recognized in a new terminal, add
   `%LOCALAPPDATA%\Android\Sdk\platform-tools` to your Windows **User Path**,
   then reopen the terminal. The preview script also checks this default SDK
   location and `ANDROID_SDK_ROOT`/`ANDROID_HOME`.

> **Tamil:** Android Studio → **SDK Manager**-ல் மேலே உள்ள packages-ஐ install
> செய்து, மேலே உள்ள commands-ஐ PowerShell-ல் ஒவ்வொன்றாக run செய்யுங்கள்.

### Connect with USB

1. On Android, open **Settings → About phone** and tap **Build number** seven
   times. Enter your screen lock if asked to enable Developer options.
2. In **Settings → Developer options**, turn on **USB debugging**.
3. Connect the phone with a USB data cable, unlock it, and accept the
   **Allow USB debugging** prompt. Choose **Always allow** only on your own
   laptop.
4. Check the connection in PowerShell:

   ```powershell
   adb devices
   ```

   The device should appear with the status `device`. If it says
   `unauthorized`, unlock the phone and accept its prompt.
5. Double-click `start_android_preview.bat` in the project folder.

> **Tamil:** Developer options-ஐ enable செய்து **USB debugging** ON செய்யுங்கள்.
> USB cable-ஐ connect செய்து phone-ல் வரும் **Allow** prompt-ஐ accept செய்யுங்கள்.

### Connect wirelessly (Android 11 or newer, if your phone supports it)

The phone and laptop must use the same Wi-Fi network. Leave Wireless debugging
enabled while previewing.

1. Enable Developer options using the **Build number** steps above.
2. Open **Settings → Developer options → Wireless debugging**, then turn it on.
3. For pairing with a code, tap **Pair device with pairing code**. On the
   laptop, run:

   ```powershell
   adb pair PHONE_IP:PAIRING_PORT
   ```

   Enter the pairing code shown on the phone.
4. Return to the main Wireless debugging screen and find the device's current
   **IP address & port**. Connect using that port:

   ```powershell
   adb connect PHONE_IP:DEBUG_PORT
   adb devices
   ```

   Pairing and connection ports can differ. The connected device should show
   status `device`.
5. Double-click `start_android_preview.bat`.

For QR pairing, Android Studio provides **Device Manager → Pair Devices Using
Wi-Fi**. Choose its QR option and scan it from the phone's **Wireless
debugging → Pair device with QR code** screen. This pairing UI is optional;
`adb pair` with the phone's pairing code works without it.

> **Tamil:** Phone மற்றும் laptop ஒரே Wi-Fi-ல் இருக்க வேண்டும். Pairing code
> பயன்படுத்தினால் முதலில் `adb pair` செய்யுங்கள்; அதன் பிறகு Wireless debugging
> screen-ல் காட்டும் IP மற்றும் port-ஐ வைத்து `adb connect` செய்யுங்கள்.

### Start again after shutting down the laptop

USB: reconnect the cable, unlock the phone, accept any debugging prompt, then
double-click `start_android_preview.bat`.

Wireless: turn Wireless debugging on again. If the laptop is still paired, run
`adb connect PHONE_IP:DEBUG_PORT` using the phone's **current** IP and port.
If pairing has been forgotten, repeat `adb pair`. Then double-click
`start_android_preview.bat`.

> **Tamil:** Laptop restart ஆன பிறகு USB cable-ஐ மீண்டும் connect செய்யுங்கள்;
> Wireless என்றால் phone-ல் Wireless debugging ON செய்து `adb connect` மீண்டும்
> run செய்யுங்கள். பிறகு `start_android_preview.bat`-ஐ open செய்யுங்கள்.

### Hot Reload

Keep the script's terminal open while the app runs. Press:

- `r` — Hot Reload; updates Dart UI changes while keeping the current app state.
- `R` — Hot Restart; restarts the running Flutter app.
- `q` — Stop the app.

The script runs `flutter pub get`, identifies an authorized connected Android
phone, prints its device name, and runs the existing app in Flutter debug mode.
It does not build a release APK or use a browser preview. If no phone or Android
SDK tools are found, it prints connection/setup guidance and waits before
closing.

## Demo functionality

- Staff sign-in and demo registration; authentication is not connected.
- Seven departments: B.C.A, B.Sc. CS, B.Sc. AIML, B.B.A, M.B.A, B.Com, and
  B.Com CA.
- First, Second, and Third Year classes with five attendance hours each.
- 45–65 deterministic fictional students per class.
- Search, four attendance statuses, Mark All Present, review, and a simulated
  submission receipt.
- Demo attendance and receipts are stored locally with `shared_preferences`.

`AttendanceRepository` is the data boundary for a future backend. This
prototype uses no college files, production authentication, reports, or
Supabase connection.

Run tests with:

```powershell
& "D:\tools\flutter\bin\flutter.bat" test
```
