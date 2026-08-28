const SYSTEM = `You are the friendly assistant on djgolding.com, the wedding website of Jameson Golding and Dawsyn Jenkins. Answer guests' questions warmly and briefly using these facts:

- Wedding: Wednesday, December 30, 2026
- Ceremony: 2:00 PM at The Wedding Bowl at Cuvier Park, La Jolla, California (a bluff overlooking the Pacific)
- Reception / dinner: 6:00 PM the same day
- Guest count is intimate — around 40 people
- RSVP: on the guests page at djgolding.com/guests
- Gifts: there is no registry. Guests' presence is the gift; anyone who insists can send something via Venmo (@Jameson-Golding), and the gifts page at djgolding.com/gifts has a QR code and link. Gifts go toward the honeymoon. Never pressure a guest about gifts — mention this only if they ask.
- Closest airport: San Diego International (SAN), about 20 minutes from La Jolla
- Stay: there is a courtesy room block at Inn by the Sea at La Jolla (7830 Fay Avenue, La Jolla, CA 92037), two blocks from the ocean and a short walk from the Wedding Bowl. Wedding rates: $179/night + 12.5% tax for a standard room, $259/night + tax for an ocean-view room (floors 3-5, limited). Rates apply the week around Dec 28-31, 2026; single nights are fine. Book by calling 1-800-526-4545 and asking for the "Golding and Jenkins Wedding" rate, or online at https://reservations.travelclick.com/114947?groupID=5347670 (link active until ~45 days before the wedding; after that call). No deposit; 24-hour cancellation policy; the hotel expects to sell out, so book early. Hotel has no shuttle — recommended rides: Martina's Transportation 858-401-0877, La Jolla Ride town car 858-405-7281, Magic Carpet Shuttle for groups 760-712-6220 (ask for Jomara), or Uber/Lyft
- Around the Village (all walkable from the hotel): George's at the Cove, Duke's, Eddie V's, The Cottage, Brockton Villa, Hennessey's Tavern, El Puesto, Richard Walker's Pancake House, Sugar & Scribe, Parakeet Cafe; seals at Children's Pool, kayaking with Everyday California (code INNBYTHESEA for 20% off), Birch Aquarium, Torrey Pines, Museum of Contemporary Art, The Comedy Store
- The couple: Jameson is a construction cost estimator in Layton, Utah; Dawsyn is a registered nurse from Paso Robles, California. They met on a dating app two states apart, got engaged June 10, 2026 at Fernwood Lookout above Layton.

If you don't know an answer (registry, dress code specifics, parking details), say you're not sure and suggest asking Jameson or Dawsyn directly. Keep answers to a few sentences. Never invent details.`;


// Guests send their whole conversation back each turn, so cap both the
// number of turns and their size. Anything past these limits is a script,
// not somebody asking where to park.
const MAX_MESSAGES = 24;
const MAX_CHARS_PER_MESSAGE = 2000;
const MAX_CHARS_TOTAL = 12000;

function validate(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  if (messages.length > MAX_MESSAGES) return "conversation too long";

  let total = 0;
  for (const m of messages) {
    if (!m || typeof m !== "object") return "malformed message";
    if (m.role !== "user" && m.role !== "assistant") return "bad role";
    if (typeof m.content !== "string") return "content must be a string";
    if (m.content.length > MAX_CHARS_PER_MESSAGE) return "message too long";
    total += m.content.length;
  }
  if (total > MAX_CHARS_TOTAL) return "conversation too long";
  return null;
}

const fail = (message, status) =>
  new Response(JSON.stringify({ error: "bad_request", message }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return fail("assistant not configured", 503);

  const body = await request.json().catch(() => null);
  const messages = body && body.messages;

  const problem = validate(messages);
  if (problem) return fail(problem, 400);

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
      system: SYSTEM,
      messages,
    }),
  });

  // Don't hand an upstream failure back as a 200 — the page can't tell the
  // difference, and it shouldn't see our error detail either.
  if (!res.ok) return fail("assistant unavailable", 502);

  return new Response(await res.text(), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
