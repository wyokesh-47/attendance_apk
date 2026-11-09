@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Campus Attendance - Android Debug Preview
cd /d "%~dp0"

echo.
echo ================================================
echo   Campus Attendance - phone preview
echo ================================================
echo.

set "FLUTTER_CMD="
where.exe flutter >nul 2>&1
if not errorlevel 1 set "FLUTTER_CMD=flutter"
if not defined FLUTTER_CMD if exist "D:\tools\flutter\bin\flutter.bat" set "FLUTTER_CMD="D:\tools\flutter\bin\flutter.bat""
if not defined FLUTTER_CMD if exist "%USERPROFILE%\development\flutter\bin\flutter.bat" set "FLUTTER_CMD="%USERPROFILE%\development\flutter\bin\flutter.bat""
if not defined FLUTTER_CMD if exist "C:\src\flutter\bin\flutter.bat" set "FLUTTER_CMD="C:\src\flutter\bin\flutter.bat""

if not defined FLUTTER_CMD (
    echo Flutter was not found.
    echo Install Flutter SDK and add its bin folder to your Windows PATH.
    echo.
    pause
    exit /b 1
)

if not exist "%~dp0android\gradlew.bat" (
    echo The Android runner is missing from this project.
    echo Run: flutter create --platforms=android .
    echo.
    pause
    exit /b 1
)

echo [1/3] Resolving Flutter packages...
call %FLUTTER_CMD% pub get
if errorlevel 1 (
    echo.
    echo flutter pub get failed. Check the message above and try again.
    echo.
    pause
    exit /b 1
)

set "ADB_EXE="
if defined ANDROID_SDK_ROOT if exist "%ANDROID_SDK_ROOT%\platform-tools\adb.exe" set "ADB_EXE=%ANDROID_SDK_ROOT%\platform-tools\adb.exe"
if not defined ADB_EXE if defined ANDROID_HOME if exist "%ANDROID_HOME%\platform-tools\adb.exe" set "ADB_EXE=%ANDROID_HOME%\platform-tools\adb.exe"
if not defined ADB_EXE if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    set "ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk"
    set "ADB_EXE=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
)
if not defined ADB_EXE (
    for /f "delims=" %%A in ('where.exe adb 2^>nul') do if not defined ADB_EXE set "ADB_EXE=%%A"
)

if not defined ADB_EXE (
    echo.
    echo Android ADB was not found. Install Android SDK Platform-Tools,
    echo or configure ANDROID_SDK_ROOT to your Android SDK folder.
    echo Setup instructions are in README.md.
    echo.
    pause
    exit /b 1
)

echo [2/3] Checking Android phones...
"%ADB_EXE%" start-server
set "DEVICE_ID="
set "DEVICE_COUNT=0"
set "FOUND_UNAUTHORIZED="
for /f "skip=1 tokens=1,2" %%A in ('"%ADB_EXE%" devices') do (
    if "%%B"=="device" (
        if not defined DEVICE_ID set "DEVICE_ID=%%A"
        set /a DEVICE_COUNT+=1
    )
    if "%%B"=="unauthorized" set "FOUND_UNAUTHORIZED=1"
)

if not defined DEVICE_ID (
    echo.
    echo No authorized Android phone was found.
    if defined FOUND_UNAUTHORIZED echo Your phone is waiting for USB-debugging approval. Accept the prompt on the phone.
    echo.
    echo Connect by USB:
    echo   1. Enable Developer options and USB debugging on your phone.
    echo   2. Connect a data-capable USB cable and accept the debugging prompt.
    echo   3. Check the connection with: adb devices
    echo.
    echo Or pair Wireless debugging and connect with:
    echo   adb pair PHONE_IP:PAIRING_PORT
    echo   adb connect PHONE_IP:DEBUG_PORT
    echo.
    echo Keep the phone and laptop on the same Wi-Fi for wireless debugging.
    echo Step-by-step instructions are in README.md.
    echo.
    pause
    exit /b 1
)

set "DEVICE_NAME="
for /f "delims=" %%N in ('"%ADB_EXE%" -s "!DEVICE_ID!" shell getprop ro.product.model 2^>nul') do if not defined DEVICE_NAME set "DEVICE_NAME=%%N"
if not defined DEVICE_NAME set "DEVICE_NAME=!DEVICE_ID!"
echo Connected Android phone: !DEVICE_NAME!  [!DEVICE_ID!]
if !DEVICE_COUNT! GTR 1 echo More than one phone is connected; using the first listed device.
echo.
echo [3/3] Starting the existing Flutter app on your phone...
echo While the app is running: press r for Hot Reload, R for Hot Restart, q to quit.
echo Keep this terminal open while previewing.
echo.

call %FLUTTER_CMD% run -d "!DEVICE_ID!"
set "RUN_RESULT=!ERRORLEVEL!"
echo.
if not "!RUN_RESULT!"=="0" echo Flutter stopped with exit code !RUN_RESULT!. See the error above.
echo The preview terminal will stay open.
echo.
pause
exit /b !RUN_RESULT!
