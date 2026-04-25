# Backend & Database Explanation - Legacy Wallet Project

## 🏗️ **What Backend is Being Used?**

This project uses **Supabase** as the backend-as-a-service (BaaS) platform. Supabase provides:
- **PostgreSQL Database** (relational database)
- **Authentication** (user signup/login)
- **Storage** (file uploads)
- **Edge Functions** (serverless functions for backend logic)
- **Real-time subscriptions** (optional, for live updates)

---

## 📊 **Database Schema - What Data is Saved?**

The database has **6 main tables**:

### 1. **`profiles`** - User Profile Information
```sql
- id (UUID, Primary Key)
- user_id (UUID, links to auth.users)
- full_name (Text)
- avatar_url (Text, optional)
- created_at, updated_at (Timestamps)
```
**What it saves:** User's personal information (name, profile picture)

---

### 2. **`wills`** - Digital Wills
```sql
- id (UUID, Primary Key)
- user_id (UUID, owner of the will)
- title (Text) - e.g., "My Will"
- type (Enum: 'audio', 'video', 'chat', 'text')
- status (Enum: 'draft', 'in_progress', 'review', 'completed')
- content (Text) - will text content
- audio_url (Text, optional) - link to audio file
- video_url (Text, optional) - link to video file
- transcript (Text, optional) - transcription of audio/video
- notes (Text, optional) - private notes
- created_at, updated_at (Timestamps)
```
**What it saves:** All will documents (text, audio, video, chat-based wills)

---

### 3. **`recipients`** - Beneficiaries/Recipients
```sql
- id (UUID, Primary Key)
- user_id (UUID, owner)
- full_name (Text, required)
- email (Text, optional)
- phone (Text, optional)
- relationship (Text, optional) - e.g., "spouse", "child"
- address (Text, optional)
- is_verified (Boolean) - whether recipient verified their identity
- verification_code (Text, optional) - for email verification
- image_url (Text, optional) - profile picture
- created_at, updated_at (Timestamps)
```
**What it saves:** People who will receive assets (beneficiaries)

---

### 4. **`assets`** - User Assets/Properties
```sql
- id (UUID, Primary Key)
- user_id (UUID, owner)
- will_id (UUID, optional) - links to specific will
- name (Text, required) - e.g., "House in Mumbai"
- category (Enum: 'property', 'investment', 'bank_account', 'vehicle', 
            'jewelry', 'digital_asset', 'insurance', 'business', 'other')
- description (Text, optional)
- estimated_value (Decimal, optional) - monetary value
- currency (Text, default: 'USD')
- location (Text, optional)
- documents_url (Text, optional) - link to uploaded documents
- created_at, updated_at (Timestamps)
```
**What it saves:** All assets user owns (properties, bank accounts, vehicles, etc.)

---

### 5. **`asset_allocations`** - Who Gets What Asset
```sql
- id (UUID, Primary Key)
- asset_id (UUID) - which asset
- recipient_id (UUID) - who gets it
- allocation_percentage (Decimal 0-100) - what percentage they get
- notes (Text, optional)
- created_at (Timestamp)
```
**What it saves:** Distribution plan - which recipient gets which asset and how much

---

### 6. **`reminders`** - Scheduled Reminders
```sql
- id (UUID, Primary Key)
- user_id (UUID)
- title (Text)
- description (Text, optional)
- reminder_type (Enum: 'review_will', 'update_assets', 'check_recipients', 
                 'security_check', 'general')
- frequency (Enum: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')
- next_reminder_date (Date)
- is_active (Boolean)
- email_notification (Boolean)
- created_at, updated_at (Timestamps)
```
**What it saves:** Reminders for users to review/update their will

---

## 🔐 **Security Features (Row Level Security - RLS)**

**Every table has security policies** that ensure:
- Users can **ONLY** see their own data
- Users can **ONLY** create/update/delete their own records
- No user can access another user's wills, assets, or recipients

Example Policy:
```sql
CREATE POLICY "Users can view their own wills" 
ON public.wills FOR SELECT 
USING (auth.uid() = user_id);
```
This means: "Only allow SELECT if the logged-in user's ID matches the will's user_id"

---

## 🔄 **How Data is Saved - Frontend to Backend Flow**

### **Step 1: Frontend Makes Request**
```typescript
// Example: Saving a new recipient
const { data, error } = await supabase
  .from("recipients")
  .insert({
    user_id: user.id,
    full_name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    relationship: "spouse"
  });
```

### **Step 2: Supabase Client Sends to Backend**
- Frontend uses `@supabase/supabase-js` library
- Sends HTTP request to Supabase API
- Includes authentication token (JWT) in headers

### **Step 3: Supabase Backend Processes**
- Validates authentication token
- Checks Row Level Security (RLS) policies
- Validates data against database schema
- Executes SQL query (INSERT/UPDATE/DELETE)

### **Step 4: Database Stores Data**
- PostgreSQL database stores the record
- Returns success/error to frontend

---

## 📝 **Common Operations in This Project**

### **1. Creating a Will**
```typescript
// From CreateAudioWill.tsx, CreateVideoWill.tsx, CreateChatWill.tsx
await supabase.from("wills").insert({
  user_id: user.id,
  type: "audio", // or "video", "chat", "text"
  title: "My Audio Will",
  status: "draft",
  audio_url: fileName // uploaded file path
});
```

### **2. Adding Recipients**
```typescript
// From Recipients.tsx
await supabase.from("recipients").insert({
  user_id: user.id,
  full_name: "Jane Doe",
  email: "jane@example.com",
  relationship: "child"
});
```

### **3. Adding Assets**
```typescript
// From AssetManagement.tsx
await supabase.from("assets").insert({
  user_id: user.id,
  name: "Family House",
  category: "property",
  estimated_value: 500000,
  currency: "USD"
});
```

### **4. Allocating Assets to Recipients**
```typescript
// From AssetManagement.tsx
await supabase.from("asset_allocations").insert({
  asset_id: selectedAsset.id,
  recipient_id: recipientId,
  allocation_percentage: 50 // 50% to this recipient
});
```

### **5. Fetching Data**
```typescript
// From Dashboard.tsx
const { data: wills } = await supabase
  .from("wills")
  .select("*")
  .order("created_at", { ascending: false });
```

---

## 🚀 **Backend Functions (Edge Functions)**

Supabase Edge Functions are serverless functions that run on the backend:

### **1. `send-verification-email`**
- **Purpose:** Sends verification email to recipients
- **What it does:**
  - Generates secure verification code
  - Hashes the code (SHA-256) for security
  - Updates recipient record with hashed code
  - Sends email via Resend API
  - Creates verification link with token

### **2. `notify-recipients`**
- **Purpose:** Notifies all recipients when a will is finalized
- **What it does:**
  - Fetches all recipients for a will
  - Sends email notification to each recipient
  - Uses Resend API for email delivery

### **3. `will-chat`**
- **Purpose:** Handles chat-based will creation (AI conversation)

---

## 📦 **File Storage**

Supabase Storage is used for:
- **Asset documents** (PDFs, images) - stored in `asset-documents` bucket
- **Audio/Video wills** - stored in Supabase storage
- **Recipient images** - profile pictures

Storage policies ensure users can only access their own files.

---

## 🔄 **Data Flow Example: Creating a Complete Will**

1. **User creates will** → Saved to `wills` table (status: "draft")
2. **User adds recipients** → Saved to `recipients` table
3. **User adds assets** → Saved to `assets` table
4. **User allocates assets** → Saved to `asset_allocations` table
5. **User finalizes will** → `wills.status` updated to "completed"
6. **System sends notifications** → Edge function `notify-recipients` sends emails

---

## 🎯 **Key Backend Concepts Used**

1. **Authentication:** Supabase Auth handles user signup/login
2. **Database:** PostgreSQL with proper relationships (foreign keys)
3. **Security:** Row Level Security (RLS) on every table
4. **API:** RESTful API automatically generated by Supabase
5. **Storage:** File storage with access policies
6. **Serverless Functions:** Edge Functions for backend logic
7. **Real-time (optional):** Can subscribe to database changes

---

## 📊 **Database Relationships**

```
users (auth.users)
  └── profiles (1:1)
  └── wills (1:many)
      └── assets (many:1, optional)
  └── recipients (1:many)
  └── assets (1:many)
      └── asset_allocations (1:many)
          └── recipients (many:1)
  └── reminders (1:many)
```

---

## 🔍 **How to See What's Saved**

1. **Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to "Table Editor"
   - View all tables and their data

2. **In Code:**
   - Check `src/integrations/supabase/types.ts` for TypeScript types
   - Check `supabase/migrations/` for database schema

---

## 💡 **Summary**

**Backend:** Supabase (PostgreSQL + Auth + Storage + Functions)  
**What's saved:** Wills, Recipients, Assets, Allocations, Reminders, User Profiles  
**How it works:** Frontend → Supabase Client → Supabase API → PostgreSQL Database  
**Security:** Row Level Security ensures users only see their own data  
**Functions:** Edge Functions handle email notifications and verification

This is a **serverless backend** - you don't manage servers, Supabase handles everything!
