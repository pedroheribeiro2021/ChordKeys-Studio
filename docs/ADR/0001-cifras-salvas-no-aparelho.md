# ADR 0001 — Cifras salvas só no aparelho (IndexedDB)

**Status**: aceita (2026-10-01)

## Contexto

O Pedro quer salvar cifras para tocar depois, principalmente no celular, com o app instalado como PWA. O projeto não tem backend nem login. A organização Supabase já está no limite de projetos gratuitos (ver `Infra-Cloud-Compartilhada` no vault).

## Decisão

As cifras ficam no próprio aparelho, em **IndexedDB** (`src/utils/songStore.js`, sem biblioteca):

- `navigator.storage.persist()` no primeiro salvamento, para o navegador não apagar os dados quando faltar espaço.
- **Backup em JSON** (exportar/importar) para levar as cifras a outro aparelho. Na importação, vence a versão editada por último (`updatedAt`).
- Cada cifra guarda também tom, capo e "simplificar", para reabrir do jeito que foi deixada.

## Alternativas consideradas

- **SQLite no navegador (WASM + OPFS)**: o arquivo do banco também fica no armazenamento do site, então tem o mesmo ciclo de vida do IndexedDB. Custaria ~1 MB de biblioteca sem nenhum ganho para uma lista de cifras.
- **Supabase com login**: sincroniza entre aparelhos, mas exige login e um schema no projeto `rachaconta`. Fica para quando houver necessidade real de sincronização.
- **localStorage**: limite baixo (~5 MB) e API síncrona; serve para o histórico de URLs, não para cifras.

## Consequências

- Apagar os dados do site ou desinstalar o app apaga as cifras. O backup é a proteção.
- No iPhone, o Safari apaga os dados de sites sem uso há 7 dias, **exceto** quando o app está instalado na tela inicial. A tela "Minhas cifras" orienta isso quando o armazenamento não está persistente.
- Migrar para sincronização no futuro é aditivo: o formato do backup já é a lista de cifras com `id` e `updatedAt`.
