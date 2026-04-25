/**
 * Minimal Deno globals and URL module types for Supabase Edge Functions (Deno runtime).
 * For full types, install the Deno extension and enable it for this path.
 */
declare namespace Deno {
  const env: { get(key: string): string | undefined };
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Promise<Response> | Response
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface SupabaseClient {
    from(table: string): unknown;
    auth: unknown;
    storage: unknown;
  }
  export function createClient(url: string, key: string): SupabaseClient;
}
