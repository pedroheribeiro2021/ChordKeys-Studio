# Pendências

Atualizado em 2026-10-01. Itens concluídos saem daqui e vão para o `Registro-de-Sessoes.md`.

## Urgente

- [ ] **Import do Cifra Club provavelmente quebrado em produção**: o Cifra Club responde 403 (Akamai, "Access Denied") a requisições fora de navegador, mesmo com User-Agent de navegador. Confirmar abrindo o import no app publicado. Não contornar a proteção anti-bot; caminho previsto: colar o texto (já funciona) e, se quiser, tirar o import ou trocar por outra fonte que permita acesso.
- [ ] **Vercel duplicada**: `chord-keys-studio` e `chord-keys-studio-staging` fazem deploy de produção da mesma branch `develop` (cada push gera dois builds iguais). Excluir o `chord-keys-studio-staging` pelo painel (a exclusão pelo Claude foi bloqueada pelas permissões). Avaliar também apontar a produção do `chord-keys-studio` para `main`.

## Testar no celular

- [ ] PWA instalado (Android e iPhone): instalação, ícone, modo offline.
- [ ] Rolagem automática: velocidade, parar e parada no fim da cifra (no teste automatizado a janela do navegador estava oculta).
- [ ] Wake Lock (tela não apagar durante a rolagem).

## Ideias para depois

- [ ] Sincronizar cifras entre aparelhos (Supabase) — ver ADR 0001.
- [ ] Editar a cifra direto na tela do Violão.
- [ ] Acordes de violão com baixo invertido (`D/F#`) desenhados com o baixo; hoje o desenho ignora o baixo.

## Outros

- [ ] `npm audit` aponta 7 vulnerabilidades em dependências (1 baixa, 1 moderada, 5 altas). Avaliar.
- [ ] Em `npm run dev` a rota `/api/fetch-chords` não existe (só no `vercel dev` ou em produção); a tela mostra o erro, mas vale documentar no README.
- [ ] `Metronome`, `ChordDisplay` e `ChordMiniKeyboard` estão sem uso e ainda com estilos inline. Decidir se voltam (o metrônomo combina com a barra de reprodução) ou se saem do código.
- [ ] Testar o PWA instalado num celular real (Android e iPhone): instalação, ícone, modo offline.
- [ ] `main` local desatualizada em relação a `origin/main` (rodar `git fetch` e atualizar).
