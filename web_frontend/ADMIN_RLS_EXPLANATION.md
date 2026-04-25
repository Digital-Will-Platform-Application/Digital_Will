# Why "Could not load data" – RLS policies explained

## What happens when the admin panel loads

1. You open **Admin Dashboard** and are logged in as admin.
2. The app runs queries like:
   - `SELECT * FROM login_activity WHERE logged_at >= ...` (for "Logged in today")
   - `SELECT * FROM profiles WHERE ...` (for "Accounts this week" / "All registered users")
3. Supabase runs these queries **with your current user** (your JWT). Before returning any rows, **Row Level Security (RLS)** is applied.

---

## What is RLS?

**Row Level Security** means: every table can have **policies** that restrict who can read or write which rows. If no policy allows the operation, you get **no rows** (or an error). So even if the table has data, you only see what the policies allow.

---

## The policies involved

### 1. Table: `login_activity`

- **RLS:** ON (enabled).
- **Policies:**
  - **"Users can insert own login"** – any logged-in user can INSERT a row where `user_id = auth.uid()` (so only their own login).
  - **"Admins can read all login activity"** – you can **SELECT** (read) from this table only if:
    ```text
    EXISTS (
      SELECT 1 FROM public.admin_emails
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    )
    ```
    So: *“Is the current user’s email (from the JWT) present in `admin_emails`?”* If **yes** → you can read all rows. If **no** → you get **no rows** (and the app shows "Could not load data" or empty).

So for the admin panel to show "Logged in today", your JWT email must match an email in `admin_emails`.

---

### 2. Table: `profiles`

- **RLS:** ON (from the original profiles setup).
- **Policies:**
  - Users can read/update their **own** profile (`user_id = auth.uid()`).
  - **"Admins can read all profiles"** – you can **SELECT** all rows only if:
    ```text
    EXISTS (
      SELECT 1 FROM public.admin_emails
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
    )
    ```
    Same idea: *“Is the current user’s email in `admin_emails`?”* If **no** → you cannot read any profiles, so the admin panel gets no data and shows the error.

So for "Accounts this week" and "All registered users", again your JWT email must be in `admin_emails`.

---

### 3. Table: `admin_emails`

- **RLS:** ON.
- **Policy:** **"Admin can read own email"** – you can only **SELECT** rows where:
  ```text
  LOWER(TRIM(email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
  ```
  So you can only see the row that matches your own email.

---

## Why the data is not fetching (the real reason)

When the database checks **"Admins can read all login activity"** or **"Admins can read all profiles"**, it has to run:

```text
EXISTS (SELECT 1 FROM public.admin_emails WHERE ...)
```

That means it has to **read from `admin_emails`**. But `admin_emails` **also has RLS**. So:

1. The policy on `login_activity` / `profiles` asks: “Is this user in `admin_emails`?”
2. To answer that, Postgres runs a SELECT on `admin_emails`.
3. That SELECT is filtered by **`admin_emails`’ own RLS** (“Admin can read own email”).
4. In some setups, this **nested check** (policy on table A reading table B that has RLS) can end up with:
   - The JWT email not matching exactly (e.g. case, spaces, or JWT claim path), or
   - The subquery not “seeing” the row in `admin_emails` because of how RLS is evaluated,

so **EXISTS** returns false → the admin is **not** considered an admin for that query → **no rows** are returned from `login_activity` or `profiles` → the admin panel shows **"Could not load data"** or empty lists.

So the reason is: **RLS policies** on `login_activity` and `profiles` depend on a subquery to `admin_emails`, and that subquery is itself restricted by RLS; if that check fails, the admin is not allowed to read and the data does not fetch.

---

## What fixes it

Use a **SECURITY DEFINER** function that:

- Runs with **elevated privileges** (so it can read `admin_emails` without being blocked by RLS on `admin_emails`).
- Returns true/false: “Is the current user’s JWT email in `admin_emails`?”
- The RLS policies on `login_activity` and `profiles` then use **only** this function (e.g. `USING (public.is_admin())`), so they no longer depend on the nested read of `admin_emails` through RLS.

That way the “is admin?” check is reliable and the admin panel can fetch data. The migration that adds this function is: **`20260202300000_admin_is_admin_function.sql`** (see below).

---

## Checklist so data fetches

1. **Run all migrations** (including `20260202300000_admin_is_admin_function.sql` if you use the fix above).
2. **Ensure your admin email is in `admin_emails`** (Table Editor → `admin_emails`). The email must be the one you use to log in (case-insensitive).
3. **Restart app / refresh** after changing `.env` or DB so the JWT and policies are up to date.
