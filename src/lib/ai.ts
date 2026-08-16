import type { Settings } from "../types";

interface AIContext {
  document: string;
  selection: string;
  instruction: string;
}

type AIProvider = (
  context: AIContext,
  signal: AbortSignal,
) => AsyncIterable<string>;

function buildUserPrompt(ctx: AIContext): string {
  const parts = [ctx.instruction.trim()];
  if (ctx.selection.trim()) {
    parts.push(`\nSelected Markdown to work on:\n${ctx.selection}`);
  } else if (ctx.document.trim()) {
    parts.push(`\nDocument so far (for context):\n${ctx.document}`);
  }
  parts.push(
    "\nReturn only the resulting Markdown — no explanations, no code fences around the whole answer.",
  );
  return parts.join("\n");
}

async function* readSSE(
  res: Response,
  extract: (json: any) => string | undefined,
): AsyncIterable<string> {
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const piece = extract(JSON.parse(data));
        if (piece) yield piece;
      } catch {
        /* ignore keep-alives / non-JSON */
      }
    }
  }
}

function anthropicProvider(s: Settings): AIProvider {
  return async function* (ctx, signal) {
    const url = (s.aiBaseUrl || "https://api.anthropic.com") + "/v1/messages";
    const res = await fetch(url, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": s.aiApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: s.aiModel || "claude-sonnet-5",
        max_tokens: 2048,
        stream: true,
        messages: [{ role: "user", content: buildUserPrompt(ctx) }],
      }),
    });
    yield* readSSE(res, (j) =>
      j.type === "content_block_delta" && j.delta?.type === "text_delta"
        ? j.delta.text
        : undefined,
    );
  };
}

function openAIProvider(s: Settings): AIProvider {
  return async function* (ctx, signal) {
    const base = s.aiBaseUrl || "https://api.openai.com";
    const res = await fetch(base + "/v1/chat/completions", {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${s.aiApiKey}`,
      },
      body: JSON.stringify({
        model: s.aiModel || "gpt-4o-mini",
        stream: true,
        messages: [
          {
            role: "system",
            content: "You are a writing assistant inside a Markdown editor.",
          },
          { role: "user", content: buildUserPrompt(ctx) },
        ],
      }),
    });
    yield* readSSE(res, (j) => j.choices?.[0]?.delta?.content ?? undefined);
  };
}

/** Build the AIProvider Crepe expects, based on the user's settings. */
export function buildAiProvider(s: Settings): AIProvider {
  return s.aiProvider === "openai" ? openAIProvider(s) : anthropicProvider(s);
}
