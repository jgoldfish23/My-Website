export async function onRequestPost({ request, env }) {
  const { messages } = await request.json();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages,
    }),
  });

  return new Response(await res.text(), {
    headers: { "content-type": "application/json" },
  });
}
