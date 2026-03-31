/**
 * Server-side Pinata proxy — keeps API keys out of the browser bundle.
 * Frontend calls POST /api/pin with the JSON body to pin.
 * Uses PINATA_API_KEY / PINATA_API_SECRET_KEY (no NEXT_PUBLIC_ prefix).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Fallback to NEXT_PUBLIC_ variants so existing env setups still work
  const apiKey =
    process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const apiSecret =
    process.env.PINATA_API_SECRET_KEY ||
    process.env.NEXT_PUBLIC_PINATA_API_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    return res
      .status(500)
      .json({ error: "Pinata credentials are not configured." });
  }

  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: apiKey,
          pinata_secret_api_key: apiSecret,
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data.error || "Pinata request failed" });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
