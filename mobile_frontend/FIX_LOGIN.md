# Fix EAS Login Error

## Quick Fix Options

### Option 1: Browser Login (Easiest) ⭐

This opens your browser for authentication - no password typing needed:

```powershell
cd mobile_frontend
eas login --browser
```

This will:
1. Open your browser
2. Let you login to Expo there
3. Automatically authenticate EAS CLI

### Option 2: SSO Login

If your account uses SSO:

```powershell
eas login --sso
```

### Option 3: Manual Login (Try Again)

Make sure you're using the correct credentials:

```powershell
eas logout
eas login
```

**Enter:**
- Username/Email: `kreddyking` (or the email associated with that account)
- Password: Your Expo account password

### Option 4: Reset Password

If you forgot your password:

1. Go to: https://expo.dev/accounts/kreddyking
2. Click "Forgot Password"
3. Reset your password
4. Then run: `eas login`

## Verify Login

After logging in:

```powershell
eas whoami
```

Should show: `kreddyking`

## Then Build APK

Once logged in:

```powershell
eas init          # Type 'y' when prompted
eas build --platform android --profile preview
```

## Or Use the All-in-One Script

Run:
```powershell
.\login-and-build.ps1
```

This script will:
- Check your login status
- Logout if wrong account
- Login as kreddyking
- Initialize project
- Build the APK
