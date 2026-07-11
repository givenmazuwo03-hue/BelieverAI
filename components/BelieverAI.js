"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  PenLine,
  ScanSearch,
  GraduationCap,
  Languages,
  Loader2,
  Copy,
  Check,
  Feather,
  Mic,
  MicOff,
  Sparkles,
} from "lucide-react";

const TOKENS = {
  ink: "#1B2430",
  inkSoft: "#2A3444",
  paper: "#EFEAD8",
  paperLine: "#DAD3B8",
  charcoal: "#2B2B28",
  crimson: "#A63446",
  crimsonSoft: "#C97B85",
  sage: "#5C7A63",
  muted: "#8A8474",
};

const LANGUAGES = [
  "Spanish","French","German","Portuguese","Italian","Mandarin Chinese",
  "Japanese","Korean","Arabic","Hindi","Russian","English",
];

const TOOLS = [
  { id: "humanize", label: "Humanize", icon: PenLine, blurb: "Rewrite stiff AI prose into something that sounds like you wrote it.", placeholder: "Paste the AI-generated text you'd like to humanize…", cta: "Humanize this", endpoint: "/api/humanize" },
  { id: "detect", label: "Detect", icon: ScanSearch, blurb: "Estimate how likely a passage is to be machine-written.", placeholder: "Paste text to check for signs of AI authorship…", cta: "Analyze text", endpoint: "/api/detect" },
  { id: "improve", label: "Improve", icon: GraduationCap, blurb: "Get line-edits and feedback on an essay draft, like a margin full of notes.", placeholder: "Paste your essay draft…", cta: "Mark it up", endpoint: "/api/improve" },
  { id: "translate", label: "Translate", icon: Languages, blurb: "Translate text into another language.", placeholder: "Type, paste, or speak the text you'd like to translate…", cta: "Translate", endpoint: "/api/translate" },
];

async function callTool(endpoint, body) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong.");
    err.status = res.status;
    throw err;
  }
  return data;
}

function useSpeechToText(onResult) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, [onResult]);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return { listening, supported, toggle };
}

function RuledTextarea({ value, onChange, placeholder }) {
  const handleResult = (transcript) => {
    onChange({ target: { value: (value ? value + " " : "") + transcript } });
  };
  const { listening, supported, toggle } = useSpeechToText(handleResult);

  return (
    <div className="relative rounded-sm overflow-hidden" style={{ border: `1px solid ${TOKENS.paperLine}` }}>
      <div className="absolute left-0 top-0 bottom-0 w-8" style={{ borderRight: `1px solid ${TOKENS.crimsonSoft}`, opacity: 0.5 }} />
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={9}
        className="w-full resize-none outline-none p-4 pl-12 pr-12 text-sm leading-8"
        style={{
          background: `repeating-linear-gradient(${TOKENS.paper}, ${TOKENS.paper} 31px, ${TOKENS.paperLine} 32px)`,
          fontFamily: "'IBM Plex Mono', monospace",
          color: TOKENS.charcoal,
        }}
      />
      {supported && (
        <button
          type="button"
          onClick={toggle}
          title={listening ? "Stop talking" : "Talk instead of typing"}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: listening ? TOKENS.crimson : TOKENS.ink, color: TOKENS.paper }}
        >
          {listening ? <MicOff size={14} /> : <Mic size={14} />}
        </button>
      )}
    </div>
  );
}

function Stamp({ children, tone }) {
  const color = tone === "human" ? TOKENS.sage : tone === "ai" ? TOKENS.crimson : TOKENS.muted;
  return (
    <div
      className="inline-block px-3 py-1 text-xs tracking-widest uppercase font-semibold"
      style={{ border: `2px solid ${color}`, color, transform: "rotate(-2deg)", fontFamily: "'IBM Plex Mono', monospace", borderRadius: "2px" }}
    >
      {children}
    </div>
  );
}

function Meter({ score }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] mb-1" style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
        <span>HUMAN</span>
        <span>MACHINE</span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${TOKENS.sage}, ${TOKENS.crimsonSoft}, ${TOKENS.crimson})` }}>
        <div className="absolute -top-1.5 w-1 h-5 rounded-full" style={{ left: `${score}%`, background: TOKENS.ink, transform: "translateX(-50%)" }} />
      </div>
    </div>
  );
}

function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={startCheckout}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full"
      style={{ background: TOKENS.crimson, color: TOKENS.paper, fontFamily: "'IBM Plex Mono', monospace" }}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
      Upgrade to Pro
    </button>
  );
}

export default function BelieverAI() {
  const { user } = useUser();
  const [active, setActive] = useState("humanize");
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("Spanish");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLimitError, setIsLimitError] = useState(false);
  const [humanizeOut, setHumanizeOut] = useState("");
  const [detectOut, setDetectOut] = useState(null);
  const [improveOut, setImproveOut] = useState(null);
  const [translateOut, setTranslateOut] = useState("");
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(null);

  const isPro = user?.publicMetadata?.plan === "pro";
  const tool = TOOLS.find((t) => t.id === active);

  const reset = () => {
    setError("");
    setIsLimitError(false);
    setHumanizeOut("");
    setDetectOut(null);
    setImproveOut(null);
    setTranslateOut("");
  };

  const switchTool = (id) => {
    setActive(id);
    setInput("");
    reset();
  };

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true);
    reset();
    try {
      const body = active === "translate" ? { text: input, targetLanguage: language } : { text: input };
      const data = await callTool(tool.endpoint, body);
      if (active === "humanize") setHumanizeOut(data.output);
      if (active === "detect") setDetectOut(data.output);
      if (active === "improve") setImproveOut(data.output);
      if (active === "translate") setTranslateOut(data.output);
      if (data.usage && typeof data.usage.remaining === "number") {
        setRemaining(data.usage.remaining);
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Try again.");
      setIsLimitError(e.status === 429);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: TOKENS.ink }}>
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <Feather size={22} color={TOKENS.paper} />
            <div>
              <h1 className="text-2xl" style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 600, color: TOKENS.paper }}>
                BelieverAI
              </h1>
              <p className="text-xs" style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
                editorial tools for honest, human writing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPro ? (
              <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: TOKENS.sage, color: TOKENS.paper, fontFamily: "'IBM Plex Mono', monospace" }}>
                PRO
              </span>
            ) : (
              <UpgradeButton />
            )}
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>

        {!isPro && remaining !== null && (
          <p className="text-xs mb-2 px-1" style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
            {remaining} free uses left today
          </p>
        )}

        <div className="flex gap-1 px-1 flex-wrap">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => switchTool(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-t-md transition-all"
                style={{
                  background: isActive ? TOKENS.paper : TOKENS.inkSoft,
                  color: isActive ? TOKENS.charcoal : TOKENS.muted,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 500,
                  transform: isActive ? "translateY(1px)" : "none",
                }}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 rounded-b-md rounded-tr-md" style={{ background: TOKENS.paper }}>
          <p className="text-sm mb-4" style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
            {tool.blurb}
          </p>

          {active === "translate" && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest" style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
                Translate into
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-sm px-2 py-1 rounded-sm outline-none"
                style={{ fontFamily: "'IBM Plex Mono', monospace", background: TOKENS.paper, border: `1px solid ${TOKENS.paperLine}`, color: TOKENS.charcoal }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          )}

          <RuledTextarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={tool.placeholder} />
          <p className="mt-2 text-xs" style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>
            Tap the mic icon to talk instead of typing (Chrome works best for this).
          </p>

          <button
            onClick={run}
            disabled={loading || !input.trim()}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-sm disabled:opacity-40"
            style={{ background: TOKENS.ink, color: TOKENS.paper, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? "Working…" : tool.cta}
          </button>

          {error && (
            <div className="mt-4">
              <p className="text-sm" style={{ color: TOKENS.crimson, fontFamily: "'IBM Plex Mono', monospace" }}>
                {error}
              </p>
              {isLimitError && (
                <div className="mt-2">
                  <UpgradeButton />
                </div>
              )}
            </div>
          )}

          {active === "humanize" && humanizeOut && (
            <div className="mt-6 pt-5" style={{ borderTop: `1px dashed ${TOKENS.paperLine}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest" style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>Rewritten</span>
                <button onClick={() => copyText(humanizeOut)} className="flex items-center gap-1 text-xs" style={{ color: TOKENS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: TOKENS.charcoal, fontFamily: "'Fraunces', serif" }}>{humanizeOut}</p>
            </div>
          )}

          {active === "detect" && detectOut && (
            <div className="mt-6 pt-5 space-y-4" style={{ borderTop: `1px dashed ${TOKENS.paperLine}` }}>
              <Meter score={detectOut.score} />
              <Stamp tone={detectOut.verdict === "likely human" ? "human" : detectOut.verdict === "likely ai" ? "ai" : "mid"}>{detectOut.verdict}</Stamp>
              <ul className="space-y-1.5">
                {(detectOut.notes || []).map((n, i) => (
                  <li key={i} className="text-sm leading-6 flex gap-2" style={{ color: TOKENS.charcoal, fontFamily: "'Fraunces', serif" }}>
                    <span style={{ color: TOKENS.crimson }}>—</span>{n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {active === "improve" && improveOut && (
            <div className="mt-6 pt-5 space-y-4" style={{ borderTop: `1px dashed ${TOKENS.paperLine}` }}>
              <p className="text-sm leading-6 italic" style={{ color: TOKENS.charcoal, fontFamily: "'Fraunces', serif" }}>{improveOut.overall}</p>
              <div className="space-y-3">
                {(improveOut.suggestions || []).map((s, i) => (
                  <div key={i} className="pl-3" style={{ borderLeft: `2px solid ${TOKENS.crimsonSoft}` }}>
                    <p className="text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      <span style={{ color: TOKENS.muted, textDecoration: "line-through" }}>{s.original}</span>
                      {"  →  "}
                      <span style={{ color: TOKENS.crimson, fontWeight: 600 }}>{s.suggestion}</span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{s.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "translate" && translateOut && (
            <div className="mt-6 pt-5" style={{ borderTop: `1px dashed ${TOKENS.paperLine}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest" style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace" }}>{language}</span>
                <button onClick={() => copyText(translateOut)} className="flex items-center gap-1 text-xs" style={{ color: TOKENS.sage, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm leading-7 whitespace-pre-wrap" style={{ color: TOKENS.charcoal, fontFamily: "'Fraunces', serif" }}>{translateOut}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
