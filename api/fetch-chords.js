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
      let content = match ? match[1] : "";

      // 🔥 remover tags HTML
      content = content
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "");

      // remover múltiplos espaços
      content = content.replace(/\n\s*\n/g, "\n\n");
      content = content.replace(/^[EADGBE]\|.*$/gm, "");

      text = content.trim();
    }

    return res.status(200).json({ text });
  } catch {
    return res.status(500).json({ error: "Failed to fetch" });
  }
}
