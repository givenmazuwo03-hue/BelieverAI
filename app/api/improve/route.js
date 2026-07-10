import { NextResponse } from "next/server";

const SYSTEM_PROMPT =
  'You are an exacting but encouraging writing tutor. Review the essay draft and respond ONLY with valid JSON, no markdown fences, no preamble, in this exact shape: {"overall": string (2-3 sentences of overall feedback), "suggestions": [{"original": string (short excerpt, under 12 words), "suggestion": string (the fix), "reason": string (short reason)}] (3-6 items)}';

function parseModelJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const raw = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    let output;
    try {
      output = parseModelJSON(raw);
    } catch {
      return NextResponse.json({ error: "Could not parse feedback." }, { status: 502 });
    }

    return NextResponse.json({ output });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
