# 🚀 Quick Guide: How to View All Database Data

## **Method 1: Use the Utility Function (Easiest for Code)**

### **Step 1: Import the function**
Add this to any component (like `Dashboard.tsx`):

```typescript
import { viewAllDatabaseData } from "@/lib/viewDatabase";
```

### **Step 2: Call it in a button or useEffect**

**Option A: Add a button to Dashboard**
```typescript
// In Dashboard.tsx, add a button:
<Button onClick={async () => {
  await viewAllDatabaseData();
}}>
  View All Database Data (Check Console)
</Button>
```

**Option B: Auto-run on page load**
```typescript
// In Dashboard.tsx, add to useEffect:
useEffect(() => {
  if (user) {
    // Uncomment this line to auto-view data on page load
    // viewAllDatabaseData();
  }
}, [user]);
```

### **Step 3: Open Browser Console**
1. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Go to **Console** tab
3. Click the button or refresh the page
4. You'll see all your database data printed!

---

## **Method 2: Supabase Dashboard (Best for All Data)**

### **View All Tables:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"Table Editor"** in left sidebar
4. Click any table name to see all rows

### **Run SQL Queries:**
1. Go to **"SQL Editor"** in left sidebar
2. Copy any query from `DATABASE_QUERIES.md`
3. Paste and click **"Run"**
4. See results below

---

## **Method 3: Quick SQL Queries**

### **See Everything at Once:**
```sql
-- Run this in Supabase SQL Editor
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'wills', COUNT(*) FROM public.wills
UNION ALL
SELECT 'recipients', COUNT(*) FROM public.recipients
UNION ALL
SELECT 'assets', COUNT(*) FROM public.assets
UNION ALL
SELECT 'asset_allocations', COUNT(*) FROM public.asset_allocations
UNION ALL
SELECT 'reminders', COUNT(*) FROM public.reminders
UNION ALL
SELECT 'auth_users', COUNT(*) FROM auth.users;
```

### **See All Users (Sign-In Database):**
```sql
SELECT 
  id,
  email,
  created_at as signup_date,
  last_sign_in_at as last_login
FROM auth.users
ORDER BY created_at DESC;
```

---

## **Method 4: Add Debug Button to Dashboard**

Add this button anywhere in your Dashboard component:

```typescript
import { viewAllDatabaseData } from "@/lib/viewDatabase";

// In your Dashboard component JSX:
<Button 
  variant="outline" 
  onClick={async () => {
    console.log("🔍 Viewing database... Check console!");
    await viewAllDatabaseData();
  }}
>
  🔍 View Database (Console)
</Button>
```

---

## **What You'll See in Console:**

When you run `viewAllDatabaseData()`, you'll see:

```
============================================================
📊 DATABASE DATA FOR USER: abc123...
============================================================

🔐 AUTH USER:
{ id: "...", email: "...", created_at: "..." }

📋 PROFILE:
{ id: "...", full_name: "...", avatar_url: "..." }

📜 WILLS (Total: 3):
[Table with all will data]

👥 RECIPIENTS (Total: 5):
[Table with all recipient data]

💰 ASSETS (Total: 8):
[Table with all asset data]

📊 ASSET ALLOCATIONS (Total: 12):
[Table with all allocation data]

🔔 REMINDERS (Total: 2):
[Table with all reminder data]

============================================================
📈 SUMMARY:
============================================================
Profile: ✅ Exists
Wills: 3
Recipients: 5
Assets: 8
Allocations: 12
Reminders: 2
============================================================
```

---

## **Quick Commands Reference**

| What to View | Command/Query |
|-------------|---------------|
| **All 6 tables** | Use `viewAllDatabaseData()` function |
| **Just counts** | Run SQL query from Method 3 |
| **Specific table** | Supabase Dashboard → Table Editor |
| **Sign-in users** | SQL: `SELECT * FROM auth.users` |
| **Your data only** | Use the utility function (respects RLS) |
| **All users' data** | Supabase Dashboard (admin access) |

---

## **Files Created:**

1. ✅ `DATABASE_QUERIES.md` - All SQL queries
2. ✅ `src/lib/viewDatabase.ts` - Utility functions
3. ✅ `HOW_TO_VIEW_DATABASE.md` - This guide

---

## **Need Help?**

- **Can't see data?** Make sure you're logged in
- **Empty results?** You might not have created any data yet
- **Permission errors?** RLS is working - you can only see your own data
- **Want to see all users?** Use Supabase Dashboard with admin access
