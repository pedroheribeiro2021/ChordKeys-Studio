# Pendências

Atualizado em 2026-10-02. Itens concluídos saem daqui e vão para o `Registro-de-Sessoes.md`.

## Ação do Pedro

- [ ] **Mergear o #29** (violão, cifras salvas e import por arquivo → `develop`) e o **#30** (sustain do teclado). São independentes, sem conflito, em qualquer ordem. Depois do deploy, recarregar o app uma vez: o service worker do PWA pode servir a versão anterior na primeira abertura.
- [ ] Decidir se a produção do `chord-keys-studio` deve seguir a `main` (hoje segue a `develop`).

## Testar no celular (não deu para verificar em navegador automatizado)

- [ ] PWA instalado (Android e iPhone): instalação, ícone, modo offline.
- [ ] Rolagem automática: parar e parada no fim da cifra. A rolagem e a mudança de velocidade foram verificadas; o resto não, porque a janela do navegador de teste estava oculta.
- [ ] Wake Lock: a tela não apaga durante a rolagem.
- [ ] Botão "Colar cifra" no iPhone e no Android (a permissão da área de transferência varia por navegador).
- [ ] Teclado: som ao segurar e soltar, sustain ligado/desligado, e a primeira tecla logo após abrir o app (PR #30).
- [ ] Abrir PDF sem internet, depois de já ter aberto um PDF uma vez (cache sob demanda do leitor).

## Ideias para depois

- [ ] Sincronizar cifras entre aparelhos (Supabase) — ver ADR 0001.
- [ ] Editar a cifra direto na tela do Violão.
- [ ] Desenhar acordes de violão com baixo invertido (`D/F#`, `Ebm7/Bb`); hoje o desenho ignora o baixo.
- [ ] "Compartilhar com o ChordKeys" no Android (Web Share Target com arquivo exige tratar o POST no service worker).
- [ ] Exportar cifra em ChordPro.

## Manutenção

- [ ] `npm audit`: 0 vulnerabilidades nas dependências do app; 5 nas de desenvolvimento (`nanoid` e `postcss`, via ferramentas de build). Não chegam ao app publicado; atualizar quando as ferramentas lançarem versão corrigida.
- [ ] `Metronome`, `ChordDisplay` e `ChordMiniKeyboard` estão sem uso e ainda com estilos inline. Decidir se voltam (o metrônomo combinaria com a barra de reprodução) ou se saem do código.
