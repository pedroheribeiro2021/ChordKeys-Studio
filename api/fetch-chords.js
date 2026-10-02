// Só busca em sites conhecidos: sem isso a função vira um proxy aberto (SSRF)
const SUPPORTED_HOSTS = ["cifraclub.com.br", "www.cifraclub.com.br", "m.cifraclub.com.br"];

const isSupported = (url) => url.protocol === "https:" && SUPPORTED_HOSTS.includes(url.hostname);

// Segue redirecionamentos manualmente, validando o domínio a cada salto
const fetchSupported = async (url, hops = 3) => {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "manual",
  });

  const location = response.headers.get("location");
  if (response.status >= 300 && response.status < 400 && location) {
    const next = new URL(location, url);
    if (hops === 0 || !isSupported(next)) throw new Error("Redirecionamento não permitido");
    return fetchSupported(next, hops - 1);
  }

  return response;
};

const HTML_ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

export const extractCifraClub = (html) => {
  const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (!match) return "";

  return match[1]
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39);/g, (entity) => HTML_ENTITIES[entity])
    .replace(/^[EADGBe]\|.*$/gm, "") // linhas de tablatura
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
};

export default async function handler(req, res) {
  let target;

  try {
    target = new URL(req.query.url);
  } catch {
    return res.status(400).json({ error: "URL inválida." });
  }

  if (!isSupported(target)) {
    return res.status(422).json({ error: "Por enquanto só é possível importar do Cifra Club." });
  }

  try {
    const response = await fetchSupported(target);

    if (!response.ok) {
      return res.status(502).json({ error: `O site respondeu com erro ${response.status}.` });
    }

    const text = extractCifraClub(await response.text());

    if (!text) {
      return res.status(422).json({ error: "Não encontrei a cifra nessa página." });
    }

    return res.status(200).json({ text });
  } catch {
    return res.status(502).json({ error: "Não foi possível acessar o site." });
  }
}
