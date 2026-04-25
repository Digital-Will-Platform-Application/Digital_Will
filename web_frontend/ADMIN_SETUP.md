# Admin & Super Admin Setup

## Why admin login was going to user panel

The app was redirecting **before** the admin role was loaded. It now waits for `adminLoading` to finish, so:

- **Admin/Super Admin** → redirects to **/admin** (Super Admin Panel or Admin Panel).
- **Regular user** → redirects to **/dashboard**.

If you still see the user panel after logging in with admin credentials, ensure your email is in `.env` as `VITE_ADMIN_EMAIL` and/or in the `admin_emails` table (see below).

---

## Super Admin credentials

**Email:** the value of `VITE_ADMIN_EMAIL` in your `.env` file.

- In your project this is: **`admin@legacywallet.com`**

**Password:** the password you set for that user in **Supabase Auth** (Dashboard → Authentication → Users). It is not stored in `.env` for security; the comment in `.env` may mention a default you used when creating the user (e.g. `Varun@2005`).

**To access the Super Admin panel:**

1. Ensure `VITE_ADMIN_EMAIL=admin@legacywallet.com` (or your chosen email) in `.env`.
2. In Supabase Dashboard → **Authentication → Users**, create or confirm a user with that **exact** email and set their password.
3. Run migrations so `admin_emails` has a row for that email with `role = 'super_admin'` (migrations `20260202400000_admin_super_admin_roles.sql` and `20260202500000_set_admin_as_super_admin.sql`).
4. Restart the dev server so env and code changes are picked up.
5. Log in at `/login` with that email and the Supabase Auth password → you should be redirected to **/admin** (Super Admin Panel).

---

## Roles

- **Super Admin:** Email in `VITE_ADMIN_EMAIL` or in `admin_emails` with `role = 'super_admin'`. Sees “Super Admin Panel”, can open Admin Settings, create/remove admins, and delete users (if the `delete-user` Edge Function is deployed).
- **Admin:** Email in `admin_emails` with `role = 'admin'`. Sees “Admin Panel”, no Admin Settings, no delete user.

The first super admin is set by migration from `VITE_ADMIN_EMAIL`; additional admins are created in **Admin Settings** by a super admin.

---

## Creating admins (Super Admin only)

In **Super Admin Panel → Admin Settings**, use **Create admin** with:

- **Full name** – Display name for the new admin
- **Email** – Login email (must not be the Super Admin email)
- **Password** – Same rules as user signup (min 8 chars, upper, lower, number, special, not leaked)

On **Save**, the app:

1. Creates a new Supabase Auth user with that email and password (and name in profile).
2. Adds the email to `admin_emails` with role `admin`.

When that person logs in with those credentials, they are redirected to **/admin** (Admin Panel), not the user dashboard. They see the same sidebar as Super Admin (Dashboard, User Management, Analytics & Reports, Profile) but **without** the Admin Settings link.
