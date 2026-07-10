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
function getSupabaseAdmin() {
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

/**
 * Auto-confirm user email setelah signup.
 * Workaround untuk masalah email confirmation Supabase yang sering gagal di free tier.
 */
export async function autoConfirmUser(userId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })

    if (error) {
      console.error("[supabase-admin] Auto-confirm failed:", error.message)
      return { success: false, reason: error.message }
    }

    console.log(`[supabase-admin] User ${userId} auto-confirmed successfully`)
    return { success: true }
  } catch (err) {
    console.error("[supabase-admin] Auto-confirm error:", err)
    return { success: false, reason: "unknown" }
  }
}