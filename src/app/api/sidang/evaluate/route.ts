import { NextResponse } from "next/server"
import { evaluateAnswer } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { pertanyaan, jawabanUser, jawabanAI } = await req.json()

    if (!pertanyaan || !jawabanUser || !jawabanAI) {
      return NextResponse.json({ error: "Pertanyaan, jawaban user, dan jawaban AI diperlukan" }, { status: 400 })
    }

    const result = await evaluateAnswer(pertanyaan, jawabanUser, jawabanAI)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Evaluate answer error:", error)
    return NextResponse.json(
      { error: "Gagal mengevaluasi jawaban" },
      { status: 500 },
    )
  }
}