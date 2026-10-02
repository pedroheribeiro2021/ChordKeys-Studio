# Pendências

Atualizado em 2026-10-01. Itens concluídos saem daqui e vão para o `Registro-de-Sessoes.md`.

## Próximo PR — layout mobile-first

- [ ] Não é responsivo: estilos inline com tamanhos fixos e nenhum breakpoint próprio. O piano (14 teclas × 50px ≈ 720px) e o `textarea` de 300px estouram a largura no celular.
- [ ] Sobras do template Vite em `src/index.css` (variáveis e estilos de `h1`/`code` que não combinam com o app).
- [ ] Textos misturam inglês e português — padronizar em português.
- [ ] PWA (manifest + service worker) para instalar no celular. É pré-requisito para as cifras salvas não serem apagadas no iPhone.

## Depois — features pedidas

- [ ] **Cifras salvas**: IndexedDB + `navigator.storage.persist()` + exportar/importar backup em JSON (decisão: só no aparelho, sem login).
- [ ] **Módulo violão**: reduzir acordes complexos (C7M(9) → C), sugerir capotraste com menos pestanas e mostrar os desenhos dos acordes no braço. O `parseChord`/`getIntervals` de `chordUtils.js` já dão a base.
- [ ] **Rolagem automática** estilo Cifra Club, com controle de velocidade.

## Outros

- [ ] `npm audit` aponta 7 vulnerabilidades em dependências (1 baixa, 1 moderada, 5 altas). Avaliar.
- [ ] Em `npm run dev` a rota `/api/fetch-chords` não existe (só no `vercel dev` ou em produção); a tela mostra o erro, mas vale documentar no README.
- [ ] `Metronome`, `ChordDisplay` e `ChordMiniKeyboard` estão sem uso (o uso no `App` estava comentado). Decidir se voltam no layout novo ou se saem do código.
- [ ] `main` local desatualizada em relação a `origin/main` (rodar `git fetch` e atualizar).
