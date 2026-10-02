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
