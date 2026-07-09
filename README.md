# BelieverAI

AI-powered writing assistant that humanizes AI text, improves essays, detects AI-generated content, and helps users write naturally.

## Features

- **Humanize** — rewrites stiff, AI-sounding text into natural prose
- **Detect** — scores a passage on how likely it is to be AI-written, with a short explanation
- **Improve** — gives an essay draft line-edits and overall feedback

## Stack

Next.js (App Router) + React, with three server-side API routes that call the Anthropic API. The API key lives only on the server — it's never sent to the browser.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and add your Anthropic API key:
   ```bash
   cp .env.example .env.local
   ```
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  page.js              # renders the main UI
  layout.js
  globals.css
  api/
    humanize/route.js   # POST { text } -> { output }
    detect/route.js     # POST { text } -> { output: { score, verdict, notes } }
    improve/route.js    # POST { text } -> { output: { overall, suggestions } }
components/
  BelieverAI.js         # main client UI
```

## Deploying

The easiest path is [Vercel](https://vercel.com) — connect the repo, add `ANTHROPIC_API_KEY` as an environment variable in project settings, and deploy.

## Notes

This is an early-stage prototype. Before using in production, consider adding auth and rate limiting to the API routes so usage can't run up an unbounded API bill.
