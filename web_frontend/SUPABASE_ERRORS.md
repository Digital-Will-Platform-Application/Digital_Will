# Supabase errors – what they are and what to do

Supabase Edge Functions are written in **TypeScript but run on Deno**, not Node. Your IDE (Cursor/VS Code) uses **Node/TypeScript** by default, so you often see errors **only in the editor**. The same code usually runs fine when you deploy or run `supabase functions serve`.

---

## 1. “Cannot find name 'Deno'”

**Where:** Red squiggle on `Deno` (e.g. `Deno.env.get(...)`).

**Why:** The editor is type-checking the file with Node/TypeScript, which doesn’t know the `Deno` global.

**What to do:**

- **Option A (recommended):** Install the **Deno** extension in Cursor/VS Code.  
  We already have `.vscode/settings.json` with `"deno.enablePaths": ["supabase/functions"]`, so once the extension is installed, only the `supabase/functions` folder uses Deno and this error goes away there.

- **Option B:** Rely on the project’s `supabase/functions/deno.d.ts`, which declares `Deno`.  
  If the editor still shows the error, it may not be using `supabase/functions/tsconfig.json`. You can **safely ignore** this in the editor; the function will still run on Supabase’s Deno runtime.

---

## 2. “Cannot find module 'https://deno.land/...'” or “...esm.sh/...supabase-js...”

**Where:** Red squiggle on the first lines, e.g.:

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

**Why:** Node/TypeScript doesn’t resolve **URL imports**; Deno does. So the editor complains even though the code is valid for Deno.

**What to do:**

- **Option A:** Use the **Deno** extension (as in 1). Then the editor uses Deno’s resolver and these imports are valid.

- **Option B:** Rely on `supabase/functions/deno.d.ts`, which declares these URL modules.  
  If the squiggles remain, **you can ignore them**; deployment and `supabase functions serve` use Deno and resolve these URLs correctly.

---

## 3. “Property 'catch' does not exist on type 'PromiseLike<...>'”

**Where:** In `.ts` or `.tsx` files that use Supabase client (e.g. `supabase.from(...).then(...).catch(...)`).

**Why:** Supabase’s client sometimes returns a **PromiseLike** that has `.then()` but no `.catch()` in its TypeScript types. So the editor reports an error even though at runtime it often behaves like a normal Promise.

**What to do:** Wrap the call in `Promise.resolve(...)` so you get a real Promise, then use `.then()` and `.catch()` on that. Example:

```ts
void Promise.resolve(
  supabase.from("profiles").select("...").maybeSingle()
)
  .then(({ data }) => { /* ... */ })
  .catch(() => { /* ... */ });
```

(We already did this in `AdminAccount.tsx`.)

---

## 4. Errors when running `supabase functions serve` or deploying

**Where:** Terminal or Supabase Dashboard when running or deploying functions.

**Typical causes:**

- **Missing env vars:** e.g. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`.  
  Set them in the Supabase Dashboard (Edge Functions → secrets) or in a `.env` file when running locally.

- **Wrong Node/Deno:** Edge Functions must run with **Deno** (Supabase does this automatically when you deploy or use `supabase functions serve`). Don’t run them with `node` or `ts-node`.

- **Table/RLS:** “relation … does not exist” or permission errors mean the DB table or RLS policies are missing or wrong. Fix migrations and RLS, then redeploy.

---

## 5. Summary

| What you see | Where | Cause | Action |
|--------------|--------|--------|--------|
| “Cannot find name 'Deno'” | Editor | Node TS doesn’t know Deno | Use Deno extension or ignore (runs on Deno) |
| “Cannot find module 'https://...'” | Editor | Node TS doesn’t resolve URL imports | Use Deno extension or ignore (runs on Deno) |
| “Property 'catch' does not exist” | Editor / build | PromiseLike typing | Use `Promise.resolve(...).then().catch()` |
| Env / deploy / DB errors | Terminal or Dashboard | Config or DB | Set secrets, fix migrations/RLS |

**Bottom line:** Red squiggles **only in** `supabase/functions/*.ts` are usually **editor/TypeScript vs Deno**. The code is valid for Supabase; install the Deno extension or ignore those editor errors. For real runtime or deploy issues, use the Supabase Dashboard and terminal error messages and fix env vars, migrations, or RLS as needed.
