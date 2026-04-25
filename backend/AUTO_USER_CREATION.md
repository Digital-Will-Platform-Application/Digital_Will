# Auto User Creation Feature

## Overview

The backend now automatically creates users in the NeonDB database when they try to save data (wills, assets, etc.) but don't exist yet. This solves the "User not found. Please register first" error.

## How It Works

1. **User logs in with Supabase** (uses UUID-based auth)
2. **User tries to save will/asset** → Frontend sends `user_email` to backend
3. **Backend middleware checks** if user exists in NeonDB by email
4. **If user doesn't exist** → Automatically creates user with:
   - Username: Generated from email (e.g., `john.doe@example.com` → `john_doe`)
   - Email: User's email from Supabase
   - Password: Temporary password (not used since auth is via Supabase)
5. **Returns user ID** → Data is saved successfully

## Implementation

### Files Modified

1. **`backend/utils/userHelper.js`** - New helper function `ensureUserExists()`
   - Checks if user exists by email
   - Creates user if not found
   - Generates unique username
   - Returns user ID

2. **`backend/routes/wills.js`** - Updated middleware
   - Uses `ensureUserExists()` instead of just looking up
   - Auto-creates user if needed

3. **`backend/routes/assets.js`** - Updated middleware
   - Uses `ensureUserExists()` instead of just looking up
   - Auto-creates user if needed

## Benefits

✅ **No more "User not found" errors**
✅ **Seamless integration** - Users don't need to register separately
✅ **Automatic sync** - Supabase users automatically get NeonDB accounts
✅ **Unique usernames** - Handles conflicts automatically

## Example Flow

```
1. User logs in with Supabase (email: john@example.com)
2. User creates chat will → Clicks "Save & Continue"
3. Frontend sends: { user_email: "john@example.com", transcript: "..." }
4. Backend:
   - Checks: Does john@example.com exist? → No
   - Creates: User with username "john", email "john@example.com"
   - Returns: user_id = 1
5. Saves will with user_id = 1
6. Success! ✅
```

## Username Generation

- Email: `john.doe@example.com`
- Username: `john_doe` (lowercase, special chars replaced with `_`)
- If `john_doe` exists: `john_doe_1`, `john_doe_2`, etc.

## Notes

- Users are created with temporary passwords (not used)
- Email is stored in lowercase for consistency
- Username conflicts are handled automatically
- All users created this way can still use the backend API normally
