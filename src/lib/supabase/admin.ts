import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client — menggunakan service role key.
 * HANYA digunakan di server-side (API routes, scripts).
 * Bypass RLS — hati-hati penggunaannya!
 */
export function createAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
