import { NextResponse } from "next/server";

const SYSTEM_PROMPT =
  'You analyze text for signs of AI authorship (repetitive rhythm, generic phrasing, over-hedging, listy structure, lack of specific voice). Respond ONLY with valid JSON, no markdown fences, no preamble, in this exact shape: {"score": number (0-100, 100 = certainly AI), "verdict": "likely human" | "uncertain" | "likely ai", "notes": string[] (2-4 short observations)}';

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
        max_tokens: 1000,
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
      return NextResponse.json({ error: "Could not parse analysis." }, { status: 502 });
    }

    return NextResponse.json({ output });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
