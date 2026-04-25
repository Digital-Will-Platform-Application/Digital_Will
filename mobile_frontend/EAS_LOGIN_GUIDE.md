# EAS Login Guide - Fix Login Errors

## Login Error Fix

If you're getting "Your username, email, or password was incorrect", try these solutions:

## Method 1: Interactive Login (Recommended)

1. **Open PowerShell** in the `mobile_frontend` directory
2. **Run:**
   ```powershell
   eas login
   ```
3. **Enter your credentials:**
   - **Username/Email:** `kreddyking` (or your Expo account email)
   - **Password:** Your Expo account password

## Method 2: Login with Access Token

If you have an Expo access token:

```powershell
eas login --access-token YOUR_ACCESS_TOKEN
```

To get an access token:
1. Go to https://expo.dev/accounts/kreddyking/settings/access-tokens
2. Create a new access token
3. Copy it and use in the command above

## Method 3: Login via Browser

```powershell
eas login --web
```

This will open your browser for authentication.

## Method 4: Check Current Login Status

```powershell
eas whoami
```

If it shows a different account, logout first:
```powershell
eas logout
```

Then login again with the correct account.

## Troubleshooting

### Wrong Account
If you're logged in as the wrong account:
```powershell
eas logout
eas login
# Enter kreddyking credentials
```

### Forgot Password
1. Go to https://expo.dev/accounts/kreddyking
2. Click "Forgot Password"
3. Reset your password
4. Then login with: `eas login`

### Two-Factor Authentication
If you have 2FA enabled:
- Use an access token instead (Method 2)
- Or use `eas login --web` (Method 3)

## Verify Login

After logging in, verify:
```powershell
eas whoami
```

Should show: `kreddyking`

## Next Steps After Login

Once logged in as `kreddyking`:

1. **Initialize project:**
   ```powershell
   eas init
   ```
   Type `y` when prompted

2. **Build APK:**
   ```powershell
   eas build --platform android --profile preview
   ```

## Quick Command Sequence

```powershell
# 1. Make sure you're logged out
eas logout

# 2. Login (will prompt for credentials)
eas login

# 3. Verify login
eas whoami

# 4. Initialize project
eas init

# 5. Build APK
eas build --platform android --profile preview
```
