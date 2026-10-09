# ADR 0001 — Cifras locais e sincronizadas (IndexedDB + Firebase)

**Status**: aceita, atualizada em 2026-10-08

## Contexto

As cifras precisam ficar acessíveis em mais de um aparelho sem exportar/importar arquivos. O projeto já usa IndexedDB e precisa continuar funcionando offline. Não há disponibilidade para criar outro schema no Supabase.

## Decisão

Manter **IndexedDB** como cópia local/offline e adicionar sincronização opcional com **Firebase Authentication + Cloud Firestore**:

- Entrar com Google para vincular a biblioteca à conta.
- Guardar cada cifra em `users/{uid}/songs/{songId}`; as Security Rules restringem acesso ao proprietário.
- Mesclar aparelhos por `updatedAt`; a edição mais recente vence. Exclusões são sincronizadas como tombstones para não ressuscitar uma música antiga.
- Manter **backup em JSON** como cópia independente.
- Cada cifra continua guardando tom transposto, tom/modo da música, capo e opção/estilo de simplificação.
- As chaves públicas de configuração do Firebase vêm de variáveis `VITE_FIREBASE_*`; regras e passos de configuração ficam no README.

## Alternativas consideradas

- **SQLite no navegador (WASM + OPFS)**: o arquivo do banco também fica no armazenamento do site, então tem o mesmo ciclo de vida do IndexedDB. Custaria ~1 MB de biblioteca sem nenhum ganho para uma lista de cifras.
- **Supabase**: não atende enquanto não houver disponibilidade para criar schema/tabela no projeto existente.
- **localStorage**: limite baixo (~5 MB) e API síncrona; serve para o histórico de URLs, não para cifras.

## Consequências

- O app segue utilizável sem login e offline; com login e internet, sincroniza na abertura da biblioteca e ao salvar/excluir.
- Firebase Spark oferece cotas gratuitas, sujeitas a limites e mudanças. O uso deve ser monitorado; o app não exige habilitar faturamento por conta própria.
- Apagar dados do navegador remove a cópia local, mas não a versão sincronizada na conta. O backup JSON segue como proteção extra.
- No iPhone, o Safari pode remover dados locais de sites sem uso; manter a sincronização ativa recupera a cópia ao entrar novamente.
