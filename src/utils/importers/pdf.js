import { layoutToCifra } from "./layout";

// Lê os trechos de texto posicionados de cada página. O pdf.js (~1 MB) só é baixado
// quando alguém abre um PDF.
export async function readPdfLayout(data) {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  // No pdf.js 6 quem libera worker e memória é a tarefa de carregamento, não o documento
  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;
  const pages = [];

  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const { items } = await page.getTextContent();

    pages.push(
      items
        .filter((it) => "str" in it)
        .map((it) => ({
          str: it.str,
          x: it.transform[4],
          y: it.transform[5],
          width: it.width,
          size: Math.hypot(it.transform[0], it.transform[1]),
        })),
    );
  }

  await task.destroy();
  return pages;
}

export async function importPdf(data) {
  const pages = await readPdfLayout(data);
  const result = layoutToCifra(pages);

  if (!result.text.trim()) {
    throw new Error(
      "Não encontrei texto nesse PDF. Se ele for uma foto ou digitalização, não dá para ler.",
    );
  }
  return result;
}
