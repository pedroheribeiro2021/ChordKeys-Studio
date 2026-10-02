# ADR 0002 — Importar cifras sem servidor (colar, .txt, ChordPro e PDF)

**Status**: aceita (2026-10-02)

## Contexto

O import por URL usava uma função serverless (`api/fetch-chords`) que baixava a página do Cifra Club e extraía a cifra. Em 2026-10-02 o Cifra Club passou a responder **403 (Akamai, "Access Denied")** a qualquer requisição que não venha de um navegador, mesmo com cabeçalhos de navegador. Além disso, uma função que busca páginas de terceiros a pedido do usuário foi a origem de uma falha de SSRF corrigida no PR #25.

## Decisão

- **Remover** a função serverless e o campo de link. O app fica 100% estático.
- Importar pelo que o usuário já tem nas mãos:
  - **Colar**: botão que lê a área de transferência, e colar direto na caixa vazia. O texto passa por limpeza: cabeçalho (`Tom:`, `Afinação:`, `Capotraste…`), tablatura, tabs e espaço não separável.
  - **`.txt`**: UTF-8 ou ANSI (Windows-1252), detectado automaticamente.
  - **ChordPro** (`.cho`, `.chopro`…): convertido para acorde-sobre-letra.
  - **PDF**: o texto é remontado pela **posição de cada trecho na página** (pdf.js). A extração em ordem embaralha letra, títulos e acordes; pela posição, cada acorde volta para a coluna da sílaba. Título e artista vêm da fonte maior; a página de desenhos de acordes do Cifra Club é descartada.
- O leitor de PDF (~1,7 MB) é carregado só quando usado e fica fora da instalação do PWA (cache sob demanda).

## Alternativas consideradas

- **Outro portal de cifras**: os grandes usam proteção anti-bot parecida. Raspar o conteúdo pelo servidor contraria os termos de uso, e cada site tem um HTML diferente que muda sem aviso.
- **Contornar a proteção do Cifra Club** (navegador headless, proxy): frágil, contra os termos do site e caro de manter. Descartado.

## Consequências

- Sem servidor, não há nada para manter nem proteger no backend, e o deploy é só arquivos estáticos.
- O fluxo no celular fica: abrir a cifra no site → copiar → "Colar cifra", ou baixar o PDF → "Abrir arquivo".
- PDF escaneado (imagem) não é lido; exigiria OCR.
- Desenhos de violão ignoram o baixo invertido (`Ebm7/Bb` é desenhado como `Ebm7`).
