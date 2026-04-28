export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = await response.text();

    let text = "";

    // 🎯 TRATAMENTO POR SITE
    if (url.includes("cifraclub")) {
      const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
      text = match ? match[1] : "";
    } else {
      // fallback simples
      text = html.replace(/<[^>]*>/g, "");
    }

    return res.status(200).json({ text });
  } catch {
    return res.status(500).json({ error: "Failed to fetch" });
  }
}
