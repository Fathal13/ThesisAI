"use server"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types"

/**
 * Supabase admin client — hanya dipakai di server-side untuk operasi
 * administratif (auto-confirm user, dll).
 *
 * WAJIB: environment variable SUPABASE_SERVICE_ROLE_KEY
 * (service_role key dari Supabase Dashboard → Settings → API)
 */
export async function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not set")
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}