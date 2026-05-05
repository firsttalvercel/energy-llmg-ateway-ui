"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  provider?: string;
  model?: string;
  tokens?: number | null;
};

const GATEWAY_URL = "/api/chat";

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hello! I'm the MOL virtual assistant. I can help you with billing, consumption, EV charging, MOL Move loyalty, fuel cards, and more. How can I help you today?",
};

const SYSTEM_PROMPT = `You are the MOL virtual assistant, helping customers across MOL's full product and service portfolio in Hungary. You assist with:

ENERGY & BILLING
- Customer invoices, billing history, payment status, contract terms
- Gas and electricity consumption data and trends

EV CHARGING (MOL Plugee)
- Charging session issues, refunds, and troubleshooting
- Charging speeds, connector types, and station locations
- Plugee account and payment questions

LOYALTY (MOL Move)
- Loyalty program registration, points balance, and redemption
- Missing points after fuel fill-ups or purchases
- Promotions and tier benefits

FUEL CARDS
- Corporate and personal fuel card issues (declined transactions, limits, activation)
- Spending limit changes and card management

ESCALATION
- If a customer asks to speak to a human agent, acknowledge their request warmly and inform them they can reach MOL Customer Service at: +36 1 464 0464 (Mon–Fri 08:00–18:00 CET), or via the contact form at mol.hu/kapcsolat. Offer to help further while they wait.
- If a customer is frustrated or angry, acknowledge their frustration empathetically, apologise for the inconvenience, and work to resolve the issue calmly and efficiently. Never match negative tone.

Current customer context (Customer ID: C001, Name: Kovács Péter):
- Current invoice: 187,500 HUF due 2026-05-15 (PENDING) — 31% higher than March due to cold weather
- Gas consumption this month: 312 m³ (+28% vs last year)
- Active outage: Budapest District V (1051–1053) — gas disruption, ERT 14:00 today
- MOL Move status: Gold tier, 4,820 points balance
- Fuel card: Corporate card ending 4471 — active, limit 150,000 HUF/month, 62% used

IMPORTANT: Always respond in English only, regardless of the language the customer writes in.
Be professional, warm, and concise. Always address the customer by name on first contact.`;

const QUICK_PROMPTS = [
  "What is my gas consumption this month?",
  "Why is my bill higher this month?",
  "Is there an outage in my area?",
  "My EV charging session didn't start, how do I get a refund?",
  "What charging speeds are available at MOL Plugee stations?",
  "How do I register for the MOL Move loyalty program?",
  "Why haven't my points been credited after my last fill-up?",
  "My MOL fuel card was declined at the pump, what should I do?",
  "How do I increase the spending limit on my corporate fuel card?",
  "I would like to talk to a human agent, please",
  "This bloody fuel card never works, fix it now!",
];

function detectProvider(model: string): string {
  if (!model) return "Unknown";
  const m = model.toLowerCase();
  if (m.startsWith("gpt") || m.includes("openai")) return "OpenAI";
  if (m.startsWith("claude")) return "Anthropic";
  if (m.startsWith("gemini") || m.includes("google")) return "Google";
  if (m.includes("amazon") || m.includes("titan") || m.includes("bedrock")) return "AWS Bedrock";
  if (m.includes("llama") || m.includes("meta")) return "Meta";
  if (m.includes("mistral")) return "Mistral";
  if (m.includes("command")) return "Cohere";
  return model;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    historyRef.current = [];
    setInput("");
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    historyRef.current.push({ role: "user", content: messageText });
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...historyRef.current,
          ],
        }),
      });

      const data = await res.json();

      // LLM Gateway content policy block (403)
      const isBlocked =
        res.status === 403 ||
        (typeof data.error === "string" && data.error.toLowerCase().includes("deny list"));

      const reply = isBlocked
        ? "I'm sorry, I'm not able to respond to that kind of message. I'm here to help with MOL services — billing, consumption, EV charging, loyalty, and fuel cards. How can I assist you?"
        : data.choices?.[0]?.message?.content ??
          (data.error?.message
            ? `Gateway error: ${data.error.message}`
            : `Gateway returned HTTP ${data._debug?.status ?? res.status} — ${JSON.stringify(data)}`);
      const model = data.model ?? "";
      const tokens: number | null = data.usage?.total_tokens ?? null;

      historyRef.current.push({ role: "assistant", content: reply });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          model,
          provider: detectProvider(model),
          tokens,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm unable to connect to the service right now. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col items-center font-sans">

      {/* Sticky header */}
      <div className="sticky top-0 z-50 w-full">
        {/* Top bar — white with MOL logo */}
        <div className="w-full bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <img
              src="https://mol.hu/images/fb-logo.jpg"
              alt="MOL"
              style={{ height: 48, width: "auto" }}
            />
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Red accent bar */}
        <div className="w-full bg-[#E30613]">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
            <p className="text-white text-sm font-medium">Virtual Assistant</p>
            <div className="flex items-center gap-4">
              <p className="text-white/70 text-xs">Powered by MuleSoft LLM Gateway</p>
              <button
                onClick={clearChat}
                className="text-xs text-white/80 hover:text-white border border-white/30 hover:border-white/70 rounded-full px-3 py-0.5 transition-colors"
              >
                Clear chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="w-full max-w-2xl flex-1 px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-[#E30613] flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-1">
                M
              </div>
            )}
            <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#E30613] text-white rounded-tr-sm"
                    : "bg-gray-100 text-gray-900 rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>

              {/* Metadata: provider + tokens */}
              {msg.role === "assistant" && msg.provider && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-gray-400">
                    {msg.provider}
                    {msg.model ? ` · ${msg.model}` : ""}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    {msg.tokens != null
                      ? `${msg.tokens.toLocaleString()} tokens`
                      : "Tokens: unavailable"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-[#E30613] flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-1">
              M
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="w-full max-w-2xl px-4 pb-3">
        <p className="text-xs text-gray-400 mb-2">Suggested questions</p>
        <div className="flex gap-2 flex-wrap">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:border-[#E30613] hover:text-[#E30613] transition-colors disabled:opacity-40 bg-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="w-full max-w-2xl px-4 pb-8 pt-2">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2 bg-white rounded-2xl px-4 py-3 border border-gray-300 focus-within:border-[#E30613] transition-colors shadow-sm"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about billing, charging, loyalty, fuel cards..."
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 disabled:opacity-50 text-gray-900"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="text-[#E30613] hover:text-red-700 disabled:opacity-30 transition-colors font-semibold text-sm"
          >
            Send
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="w-full border-t border-gray-100 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Created by Tal First, Lead Solutions Engineer
          </span>
          <a
            href="https://mol.hu/kapcsolat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#E30613] hover:underline"
          >
            Contact us
          </a>
        </div>
      </div>
    </main>
  );
}
