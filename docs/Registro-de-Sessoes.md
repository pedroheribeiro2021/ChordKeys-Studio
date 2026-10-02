# Registro de sessões

## 2026-10-01 — Diagnóstico e correções do núcleo (PR 1)

**Objetivo**: avaliar o estado do projeto, corrigir os bugs encontrados e preparar a base para as features de cifras salvas, módulo de violão e rolagem automática.

**Diagnóstico inicial**: o build passava, mas o lint tinha 14 erros. Havia alterações não commitadas na branch `feature/import-from-url`, que já tinha sido mergeada (PR #24). Layout não responsivo.

**Alterações** (branch `fix/core-playback-and-parsing`, criada a partir de `develop`):
- Trabalho pendente (pause/resume, inversão, tétrades) commitado como estava.
- `chordUtils`: interpretador de acordes (`parseChord`/`getIntervals`) que entende bemóis, `7M`/`maj7`, `m7(b5)`, `º`/`dim`, `aug`, `sus2/4`, `6`, `add9`, tensões entre parênteses e baixo invertido (`D/F#`).
- `transpose`: transpõe fundamental e baixo mantendo o sufixo; preserva bemol. Agora também vale no modo letra+acordes e na música demo.
- `lyricsParser`/`songBuilder`: ignora marcadores (`[Intro]`, `(2x)`); linha de acordes seguida de outra linha de acordes não consome letra; a letra do karaokê é cortada pela coluna do acorde, recuando até o início da palavra.
- `audioEngine`: agenda em ticks, então o BPM passou a valer, inclusive ao vivo (antes era ignorado). UI sincronizada com `Tone.getDraw()`. O fim da música segue o relógio do áudio via `setTimeout` e funciona com a aba em segundo plano. `getProgress()` lê a posição real do Transport.
- Reprodução centralizada no `App` (Player e ChordInput viraram só interface). "Clear" para a reprodução. Letra do karaokê não aparece mais duplicada. O histórico de URLs atualiza a tela na hora e o import mostra os erros.
- `ChordDiagram`: corrigido o crash de hooks (`useMemo` vinha depois de um `return null`).
- `api/fetch-chords`: lista de domínios permitidos (fecha o SSRF), redirecionamentos validados a cada salto, `res.ok`, decodificação de entidades HTML, erros com status certo.
- Lint zerado. Removidos `App.css` e `styles/piano.css` (sobras do template). `index.html` com `lang="pt-BR"` e título.
- Vitest com 44 testes (acordes, transposição, parser, função serverless). CI agora roda lint + testes + build em Node 22 (o Vitest 5 exige Node 22 ou mais novo).

**Verificação**: lint, testes e build passando. No navegador, a mesma música durou 8,2 s a 90 BPM e 4,1 s a 180 BPM; pause congela os ticks, resume continua e stop zera. A janela do Chrome estava oculta, então a parte visual (destaque do acorde ativo, barra de progresso) não foi conferida na tela.

**Decisões**:
- Cifras salvas ficam só no aparelho: IndexedDB + `persist()` + backup em JSON. SQLite no navegador não muda onde os dados ficam.
- Ordem: correções (este PR) → layout mobile-first → features.
- Módulo violão inclui as três partes: reduzir acordes, capotraste e desenhos dos acordes.

**Próximos passos**: ver `Pendencias.md`. O próximo é o layout mobile-first.

## 2026-10-01 — Layout mobile-first e PWA (PR 2)

**Objetivo**: tornar o app usável no celular e instalável, como base para as cifras salvas.

**Alterações** (branch `feat/mobile-first-layout`, criada a partir de `fix/core-playback-and-parsing`):
- `index.css` reescrito, mobile-first: tokens de cor para tema claro e escuro, cartões, botões com área de toque de 44 px e respeito à área segura (`safe-area-inset`). A partir de 900 px vira duas colunas (cifra | tocando + acordes) com o teclado embaixo. Estilos inline trocados por classes.
- Barra de reprodução fixa no rodapé: tocar/pausar num botão só, parar, tom −/+ e BPM. Tocar com a cifra vazia toca a progressão de exemplo.
- Cartão "Cifra": link do Cifra Club (formulário, Enter importa, estado "Importando…"), histórico em faixa rolável, área de texto em fonte mono (preserva o alinhamento acorde/letra), batidas por acorde e Limpar.
- Piano: teclas viram `<button>` (acessíveis por teclado) com largura fluida (`clamp`). No celular as duas oitavas rolam na horizontal, sem estourar a página.
- Timeline: rola só a faixa horizontal. O `scrollIntoView` antigo também rolava a página inteira, e no celular a tela pulava a cada acorde.
- Textos em português; estados vazios com orientação.
- PWA com `vite-plugin-pwa`: manifest, service worker (offline, atualização automática, `/api` fora do fallback), ícone próprio (teclas de piano) em SVG + PNG 192/512, versão maskable e `apple-touch-icon`. Removidos `icons.svg` e o logo do Vite (sobras do template).

**Verificação**: lint, 44 testes e build passando. No Chrome, a 390 px a página não tem rolagem horizontal; layout conferido em 390 px e 1080 px. No build de produção, o service worker ativa e o manifest carrega com os 3 ícones. Não testado num celular real nem instalado.

**Próximos passos**: cifras salvas (IndexedDB + `persist()` + backup em JSON), módulo violão e rolagem automática.

## 2026-10-02 — Cifras salvas, módulo violão e rolagem automática (PR 3)

**Objetivo**: as três features pedidas pelo Pedro, sobre o layout mobile-first.

**Alterações** (branch `feat/guitar-library-autoscroll`, criada a partir de `feat/mobile-first-layout`):
- Três telas com abas e navegação por hash (`useHashView`): **Estúdio** (o app de antes), **Violão** e **Minhas cifras**. Sair do Estúdio para a música, porque a barra de reprodução só existe lá.
- `utils/guitar.js`: qualidade do formato (`shapeQuality`), dicionário de acordes abertos + formatos com pestana (de Mi e de Lá) para qualquer fundamental, `simplifyChord` (C7M(9) → C, F#m7(b5) → F#m, D/F# → D) e `suggestCapo` (casa que deixa menos pestanas; no empate, a mais baixa).
- `utils/sheet.js`: formata a cifra trocando os acordes (tom, capo, simplificar) sem desalinhar a letra.
- `GuitarView`: título/artista, salvar, simplificar, capo com sugestão ("Capo na 3ª casa deixa 1 acorde com pestana (hoje: 6). Usar"), tamanho da letra, desenhos dos acordes em SVG e cifra com acordes destacados. Barra inferior com rolagem automática (velocidade 1–10, 4 px/s por nível) e tom. A rolagem mantém a tela acesa (Wake Lock) e para sozinha no fim.
- `utils/songStore.js` + `Library`: cifras em IndexedDB com tom/capo/simplificar, lista alfabética, excluir com confirmação em dois toques, exportar/importar backup em JSON, aviso para instalar o app no iPhone (ADR 0001).
- `SaveSong`: cifra nova pede título/artista; cifra já salva grava as alterações direto.

**Verificação**: lint, 202 testes (inclui 120 que conferem que cada desenho de acorde soa as notas certas, para as 12 fundamentais × 10 qualidades) e build passando. No navegador (390 px e 900 px): Violão, sugestão e aplicação do capo, simplificação mantendo colunas, salvar → lista → reabrir com os ajustes restaurados. A rolagem anda e acelera com a velocidade; parar e o fim da cifra não puderam ser confirmados na tela, porque a janela do Chrome estava oculta e com os timers estrangulados.

**Achados**: o Cifra Club bloqueia requisições de servidor (403 do Akamai), então o import por URL deve estar quebrado em produção. A Vercel tem dois projetos fazendo deploy da mesma branch. Ambos estão em `Pendencias.md`.

**Decisões**: ADR 0001 (cifras só no aparelho). Desenhos de violão ignoram o baixo invertido. A simplificação reduz tudo a maior, menor ou diminuto.

**Próximos passos**: excluir o projeto duplicado na Vercel, decidir o futuro do import e testar no celular.
