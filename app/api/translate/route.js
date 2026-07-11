import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkAndUseCredit } from "../../../../lib/usage";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }

    const usage = await checkAndUseCredit(userId);
    if (!usage.allowed) {
      return NextResponse.json(
        { error: `Daily free limit reached (${usage.limit}/day). Upgrade to Pro for unlimited use.` },
        { status: 429 }
      );
    }

    const { text, targetLanguage } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }
    if (!targetLanguage) {
      return NextResponse.json({ error: "No target language provided." }, { status: 400 });
    }

    const systemPrompt = `You translate text into ${targetLanguage}. Respond with only the translation, no preamble, no notes, no quotes.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const output = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    return NextResponse.json({ output, usage });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
