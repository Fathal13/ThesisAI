import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

/** GET /api/donations/stats — donasi total (tanpa auth, public) */
export async function GET() {
  try {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: goal } = await supabaseAdmin
      .from("donation_goal")
      .select("*")
      .single()

    const row = goal as unknown as { target_amount_idr: number; current_amount_idr: number; progress_percent: number; remaining_amount_idr: number } | null

    return NextResponse.json({
      target_amount_idr: row?.target_amount_idr ?? 5000000,
      current_amount_idr: row?.current_amount_idr ?? 0,
      progress_percent: row?.progress_percent ?? 0,
      remaining_amount_idr: row?.remaining_amount_idr ?? 5000000,
    })
  } catch (error) {
    console.error("[Donations] Stats error:", error)
    return NextResponse.json(
      { target_amount_idr: 5000000, current_amount_idr: 0, progress_percent: 0, remaining_amount_idr: 5000000 },
    )
  }
}
