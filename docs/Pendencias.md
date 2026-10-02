# Pendências

Atualizado em 2026-10-01. Itens concluídos saem daqui e vão para o `Registro-de-Sessoes.md`.

## Próximo — features pedidas

- [ ] **Cifras salvas**: IndexedDB + `navigator.storage.persist()` + exportar/importar backup em JSON (decisão: só no aparelho, sem login).
- [ ] **Módulo violão**: reduzir acordes complexos (C7M(9) → C), sugerir capotraste com menos pestanas e mostrar os desenhos dos acordes no braço. O `parseChord`/`getIntervals` de `chordUtils.js` já dão a base.
- [ ] **Rolagem automática** estilo Cifra Club, com controle de velocidade.

## Outros

- [ ] `npm audit` aponta 7 vulnerabilidades em dependências (1 baixa, 1 moderada, 5 altas). Avaliar.
- [ ] Em `npm run dev` a rota `/api/fetch-chords` não existe (só no `vercel dev` ou em produção); a tela mostra o erro, mas vale documentar no README.
- [ ] `Metronome`, `ChordDisplay` e `ChordMiniKeyboard` estão sem uso e ainda com estilos inline. Decidir se voltam (o metrônomo combina com a barra de reprodução) ou se saem do código.
- [ ] Testar o PWA instalado num celular real (Android e iPhone): instalação, ícone, modo offline.
- [ ] `main` local desatualizada em relação a `origin/main` (rodar `git fetch` e atualizar).
