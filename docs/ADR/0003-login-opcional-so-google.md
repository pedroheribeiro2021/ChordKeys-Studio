# ADR 0003 — Login opcional, só com Google, visível no topo

**Status**: aceita (2026-10-16)

## Contexto

Com o Firebase configurado, o único ponto de login era o botão "Entrar com Google" no fim da aba "Minhas cifras", difícil de achar. O Pedro perguntou se o app deveria ter uma tela de login e de criação de conta.

## Decisão

- **Login opcional.** O app continua funcionando sem conta e offline, com as cifras no aparelho (ADR 0001). A conta só acrescenta a sincronização entre aparelhos.
- **Só Google.** O primeiro "Entrar com Google" já cria a conta no Firebase, então não há tela de cadastro. O provedor E-mail/senha foi desativado no console.
- **Visível em todas as telas.** Há um botão de conta no topo: "Entrar" sem login; com login, o avatar abre um menu com "Sincronizar agora" e "Sair".
- **Boas-vindas na primeira abertura**, com "Entrar com Google" e "Continuar sem conta". A escolha fica em `localStorage` (`chordkeys:welcome-seen`).
- O estado da conta e a sincronização ficam no hook `useAccount`, no `App`. Assim o login sincroniza em qualquer tela, não só em "Minhas cifras".
- O login usa popup também no celular. O redirecionamento passa pelo domínio `firebaseapp.com`, e os navegadores atuais bloqueiam o armazenamento entre domínios, o que perdia o login na volta. O redirecionamento fica só como plano B, quando o popup é bloqueado.

## Alternativas consideradas

- **Login obrigatório**: travaria quem usa o app sem internet ou só quer tocar uma cifra rápida, contra o desenho offline do app.
- **Cadastro com e-mail e senha**: exigiria telas de cadastro, confirmação de e-mail e "esqueci minha senha", com pouco ganho, porque quase todo mundo tem conta Google.

## Consequências

- Quem não tem ou não quer usar conta Google não sincroniza; continua com o backup em JSON.
- No iPhone com o app instalado na tela inicial, o popup do Google abre por cima do app. Se der problema, a alternativa é passar o login pelo próprio domínio do app (redirecionar `/__/auth` para o Firebase e trocar `VITE_FIREBASE_AUTH_DOMAIN`).
