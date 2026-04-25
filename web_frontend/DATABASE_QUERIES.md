# Database Queries - How to View All Saved Data

## 🔍 **Method 1: Using Supabase Dashboard (Easiest)**

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project: `xagonodpwvhhrypnolif`
3. Click **"Table Editor"** in the left sidebar
4. Click on any table name to see all rows

---

## 📊 **Method 2: SQL Queries in Supabase Dashboard**

Go to **SQL Editor** in Supabase Dashboard and run these queries:

### **1. View All Users (Authentication Database)**
```sql
-- View all signed-up users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ORDER BY created_at DESC;
```

### **2. View All Profiles**
```sql
SELECT * FROM public.profiles
ORDER BY created_at DESC;
```

### **3. View All Wills**
```sql
SELECT 
  id,
  user_id,
  title,
  type,
  status,
  created_at,
  updated_at
FROM public.wills
ORDER BY created_at DESC;
```

### **4. View All Recipients**
```sql
SELECT 
  id,
  user_id,
  full_name,
  email,
  phone,
  relationship,
  is_verified,
  created_at
FROM public.recipients
ORDER BY created_at DESC;
```

### **5. View All Assets**
```sql
SELECT 
  id,
  user_id,
  name,
  category,
  estimated_value,
  currency,
  location,
  created_at
FROM public.assets
ORDER BY created_at DESC;
```

### **6. View All Asset Allocations**
```sql
SELECT 
  aa.id,
  aa.asset_id,
  a.name as asset_name,
  aa.recipient_id,
  r.full_name as recipient_name,
  aa.allocation_percentage,
  aa.notes
FROM public.asset_allocations aa
LEFT JOIN public.assets a ON aa.asset_id = a.id
LEFT JOIN public.recipients r ON aa.recipient_id = r.id
ORDER BY aa.created_at DESC;
```

### **7. View All Reminders**
```sql
SELECT 
  id,
  user_id,
  title,
  reminder_type,
  frequency,
  next_reminder_date,
  is_active,
  created_at
FROM public.reminders
ORDER BY created_at DESC;
```

---

## 🔗 **Method 3: View Complete User Data (All Tables Joined)**

### **Get Everything for a Specific User**
```sql
-- Replace 'USER_ID_HERE' with actual user ID
SELECT 
  -- Profile
  p.full_name as user_name,
  p.avatar_url,
  
  -- Wills Count
  (SELECT COUNT(*) FROM public.wills WHERE user_id = p.user_id) as total_wills,
  
  -- Recipients Count
  (SELECT COUNT(*) FROM public.recipients WHERE user_id = p.user_id) as total_recipients,
  
  -- Assets Count
  (SELECT COUNT(*) FROM public.assets WHERE user_id = p.user_id) as total_assets,
  
  -- Reminders Count
  (SELECT COUNT(*) FROM public.reminders WHERE user_id = p.user_id) as total_reminders
  
FROM public.profiles p
WHERE p.user_id = 'USER_ID_HERE';
```

### **Get All Wills with Details**
```sql
SELECT 
  w.id,
  w.title,
  w.type,
  w.status,
  p.full_name as creator_name,
  (SELECT COUNT(*) FROM public.assets WHERE will_id = w.id) as assets_count,
  w.created_at,
  w.updated_at
FROM public.wills w
LEFT JOIN public.profiles p ON w.user_id = p.user_id
ORDER BY w.created_at DESC;
```

### **Get All Assets with Allocations**
```sql
SELECT 
  a.id,
  a.name,
  a.category,
  a.estimated_value,
  a.currency,
  p.full_name as owner_name,
  COUNT(aa.id) as recipient_count,
  SUM(aa.allocation_percentage) as total_allocated_percentage
FROM public.assets a
LEFT JOIN public.profiles p ON a.user_id = p.user_id
LEFT JOIN public.asset_allocations aa ON a.id = aa.asset_id
GROUP BY a.id, a.name, a.category, a.estimated_value, a.currency, p.full_name
ORDER BY a.created_at DESC;
```

---

## 💻 **Method 4: Using Frontend Code (React/TypeScript)**

### **View All Data in Console**

Add this to any component (like Dashboard.tsx) to log all data:

```typescript
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Function to view all database data
const viewAllDatabaseData = async () => {
  const { user } = useAuth();
  
  if (!user) {
    console.log("No user logged in");
    return;
  }

  console.log("=== DATABASE DATA FOR USER:", user.id, "===");

  // 1. Get Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  console.log("📋 PROFILE:", profile);

  // 2. Get All Wills
  const { data: wills } = await supabase
    .from("wills")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  console.log("📜 WILLS:", wills);
  console.log("Total Wills:", wills?.length || 0);

  // 3. Get All Recipients
  const { data: recipients } = await supabase
    .from("recipients")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  console.log("👥 RECIPIENTS:", recipients);
  console.log("Total Recipients:", recipients?.length || 0);

  // 4. Get All Assets
  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  console.log("💰 ASSETS:", assets);
  console.log("Total Assets:", assets?.length || 0);

  // 5. Get All Asset Allocations
  const { data: allocations } = await supabase
    .from("asset_allocations")
    .select(`
      *,
      assets:asset_id (name, category),
      recipients:recipient_id (full_name, email)
    `)
    .order("created_at", { ascending: false });
  console.log("📊 ASSET ALLOCATIONS:", allocations);
  console.log("Total Allocations:", allocations?.length || 0);

  // 6. Get All Reminders
  const { data: reminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  console.log("🔔 REMINDERS:", reminders);
  console.log("Total Reminders:", reminders?.length || 0);

  // 7. Get Auth User Info
  const { data: { user: authUser } } = await supabase.auth.getUser();
  console.log("🔐 AUTH USER:", {
    id: authUser?.id,
    email: authUser?.email,
    created_at: authUser?.created_at,
    last_sign_in: authUser?.last_sign_in_at
  });
};

// Call this function in useEffect or button click
useEffect(() => {
  viewAllDatabaseData();
}, [user]);
```

---

## 🛠️ **Method 5: Create a Debug Page**

Create a new page `src/pages/DatabaseViewer.tsx`:

```typescript
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DatabaseViewer = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>({});

  const fetchAllData = async () => {
    if (!user) return;

    const [profiles, wills, recipients, assets, allocations, reminders, authUser] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id),
      supabase.from("wills").select("*").eq("user_id", user.id),
      supabase.from("recipients").select("*").eq("user_id", user.id),
      supabase.from("assets").select("*").eq("user_id", user.id),
      supabase.from("asset_allocations").select("*"),
      supabase.from("reminders").select("*").eq("user_id", user.id),
      supabase.auth.getUser()
    ]);

    setData({
      profile: profiles.data,
      wills: wills.data,
      recipients: recipients.data,
      assets: assets.data,
      allocations: allocations.data,
      reminders: reminders.data,
      authUser: authUser.data.user
    });
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Database Viewer</h1>
      <Button onClick={fetchAllData} className="mb-4">Refresh Data</Button>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle>Auth User</CardTitle></CardHeader>
          <CardContent>
            <pre>{JSON.stringify(data.authUser, null, 2)}</pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Profile ({data.profile?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <pre>{JSON.stringify(data.profile, null, 2)}</pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Wills ({data.wills?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <pre>{JSON.stringify(data.wills, null, 2)}</pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Recipients ({data.recipients?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <pre>{JSON.stringify(data.recipients, null, 2)}</pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Assets ({data.assets?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <pre>{JSON.stringify(data.assets, null, 2)}</pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Allocations ({data.allocations?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <pre>{JSON.stringify(data.allocations, null, 2)}</pre>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Reminders ({data.reminders?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            <pre>{JSON.stringify(data.reminders, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseViewer;
```

---

## 📋 **Quick Reference: Table Counts**

### **Get Count of Records in Each Table**
```sql
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 
  'wills', COUNT(*) FROM public.wills
UNION ALL
SELECT 
  'recipients', COUNT(*) FROM public.recipients
UNION ALL
SELECT 
  'assets', COUNT(*) FROM public.assets
UNION ALL
SELECT 
  'asset_allocations', COUNT(*) FROM public.asset_allocations
UNION ALL
SELECT 
  'reminders', COUNT(*) FROM public.reminders
UNION ALL
SELECT 
  'auth_users', COUNT(*) FROM auth.users;
```

---

## 🔐 **View Authentication Database (Sign-In Users)**

### **All Signed-Up Users**
```sql
SELECT 
  id,
  email,
  created_at as signup_date,
  last_sign_in_at as last_login,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;
```

### **Users with Their Profiles**
```sql
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as signup_date,
  u.last_sign_in_at,
  p.full_name,
  p.avatar_url
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC;
```

---

## 🎯 **Summary**

**Easiest Method:** Use Supabase Dashboard → Table Editor

**For SQL Queries:** Use Supabase Dashboard → SQL Editor

**For Code:** Use the frontend code examples above

**To See Everything:** Run the "Quick Reference: Table Counts" query

---

## ⚠️ **Important Notes**

1. **Row Level Security (RLS):** When logged in, you can only see YOUR OWN data
2. **To see ALL users' data:** You need to use the Supabase Dashboard with admin access
3. **Auth.users table:** Only accessible via SQL Editor or admin dashboard, not from frontend code
4. **Production vs Development:** Make sure you're checking the right environment!
