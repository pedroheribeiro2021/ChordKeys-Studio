import { afterEach, describe, expect, it, vi } from "vitest";
import handler, { extractCifraClub } from "./fetch-chords";

const mockRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

afterEach(() => vi.unstubAllGlobals());

describe("extractCifraClub", () => {
  it("limpa tags, entidades e tablatura", () => {
    const html = `<pre><b>C</b>   <b>G</b>\nEu &amp; você\ne|---0---|\nB|---1---|</pre>`;
    expect(extractCifraClub(html)).toBe("C   G\nEu & você");
  });
});

describe("handler", () => {
  it("recusa domínios fora da lista (SSRF)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const res = mockRes();

    await handler({ query: { url: "http://169.254.169.254/latest/meta-data" } }, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("recusa redirecionamento para fora do Cifra Club", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 302, headers: { location: "http://localhost:3000" } })),
    );
    const res = mockRes();

    await handler({ query: { url: "https://www.cifraclub.com.br/x/y/" } }, res);

    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("devolve a cifra extraída", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<pre>C G\nLetra</pre>")));
    const res = mockRes();

    await handler({ query: { url: "https://www.cifraclub.com.br/x/y/" } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ text: "C G\nLetra" });
  });
});
