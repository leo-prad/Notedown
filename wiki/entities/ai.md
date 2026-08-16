# AI provider — `src/lib/ai.ts`

This unused module can construct an async streaming provider based on
[[types]] settings. It builds an instruction plus selection/document-context
prompt, posts streaming requests to Anthropic Messages or OpenAI-compatible
Chat Completions endpoints, and parses SSE `data:` lines into text chunks.

`buildAiProvider` selects the OpenAI path only for `aiProvider === "openai"`;
the `custom` option currently follows the Anthropic request shape despite the
settings label claiming OpenAI compatibility. No component imports this module.
The API key is persisted in session JSON in plaintext. See [[known-limitations]].

