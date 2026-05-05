# MOL Energy — Virtual Assistant UI

A Next.js chatbot frontend for the MOL Energy customer assistant, powered by the **MuleSoft LLM Gateway**.

Built by Tal First, Lead Solutions Engineer @ MuleSoft/Salesforce — as a demo for MOL Hungary.

---

## What It Does

A fully functional AI chat interface that allows MOL customers to self-serve across:

| Topic | Details |
|-------|---------|
| Billing & Invoices | Invoice status, payment history, contract terms |
| Gas Consumption | Monthly usage, trends, year-over-year comparison |
| Outages | Real-time service disruption alerts by district |
| EV Charging (MOL Plugee) | Session issues, refunds, station info, connector types |
| Loyalty (MOL Move) | Points balance, missing points, tier status, promotions |
| Fuel Cards | Declined transactions, limit changes, card activation |
| Human Escalation | Warm handoff with MOL customer service contact details |

---

## Architecture

```
Browser → Next.js Frontend → /api/chat (Next.js Route Handler)
                                      ↓
                          MuleSoft LLM Gateway
                                      ↓
                     LLM Provider (OpenAI / Anthropic / etc.)
```

- The frontend sends chat history + a system prompt to `/api/chat`
- The API route proxies the request to the **MuleSoft LLM Gateway**
- The gateway handles model routing, content policy enforcement, and token tracking
- Responses include `model`, `provider`, and `token` metadata rendered in the UI

---

## Features

- MOL-branded UI (red `#E30613`, white, clean sans-serif)
- Sticky header with MOL logo + "Powered by MuleSoft LLM Gateway" label
- Suggested quick prompts covering all main use cases
- Per-message metadata: provider name, model ID, total tokens
- Content policy handling: gateway 403 blocks shown as a polite deflection
- Clear chat button resets conversation history
- Responsive, mobile-friendly layout

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file:

```env
GATEWAY_URL=<your-mulesoft-llm-gateway-endpoint>
GATEWAY_API_KEY=<your-api-key>
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI Gateway | MuleSoft LLM Gateway |
| Deployment | Vercel |

---

## Project Structure

```
app/
  page.tsx          # Main chat UI component
  api/chat/         # Route handler — proxies to LLM Gateway
  layout.tsx        # Root layout
  globals.css       # Global styles
public/             # Static assets
```

---

## Demo Context

The assistant is pre-loaded with a mock customer profile (Kovács Péter, Customer ID: C001) including live invoice data, consumption figures, an active outage, and loyalty/fuel card status — designed to showcase realistic, contextual AI responses in a sales demo setting.
