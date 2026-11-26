# Análise e plano de refinamento do gerador de jogos

Consolidado de 7 agentes especialistas (engenharia, arquitetura, QA, pesquisa científica, segurança, UX/UI e dev), 25/11/2026. Nenhuma alteração de código foi mantida — os agentes que editaram arquivos durante a análise foram revertidos.

## 0. Limite inegociável

Cada concurso é independente. Com um jogo, `P(todos) = 1 / C(N,k)`, constante:

| Modalidade | N | k | C(N,k) | 1 jogo | m jogos distintos |
|---|---:|---:|---:|---:|---:|
| Mega-Sena | 60 | 6 | 50.063.860 | 1 em 50.063.860 | m / 50.063.860 |
| Lotofácil | 25 | 15 | 3.268.760 | 1 em 3.268.760 | m / 3.268.760 |
| Quina | 80 | 5 | 24.040.016 | 1 em 24.040.016 | m / 24.040.016 |

**A única alavanca real é `m` (jogos distintos), com custo proporcional.** Com jogos repetidos a chance é menor que `m/C`. Nenhum modelo, IA ou técnica quântica altera esse teto.

Valores complementares (Mega-Sena, calculados com `math.comb`): exatamente 4 = 1 em 2.332,35; exatamente 5 = 1 em 154.518,09; 4+ = 1 em 2.297,56; 5+ = 1 em 154.042,65. Hipergeométrica: `P(j) = C(k,j)·C(N−k,k−j)/C(N,k)`.

### Correção de enquadramento (importante)

Afirmações de que o "pool de 65%" reduz a chance **por jogo** estão erradas: qualquer combinação, mesmo gerada de um subconjunto enviesado, tem probabilidade `1/C` contra um sorteio uniforme. O que o pool e os filtros fazem é:

- enviesar a **distribuição marginal** da carteira (dezena 48 com z ≈ +13,9 no teste de QA);
- reduzir **diversidade/cobertura** de cenários (o pool cobre 6,52% do espaço da Mega-Sena, 1,66% da Lotofácil, 10,81% da Quina);
- reforçar a ilusão de que "números quentes" têm vantagem.

A degradação efetiva da chance agregada vem de **duplicatas** no fallback (`probability.py:538-540`). O "backtest até acertar" (`_target_search`) não melhora nada: é viés de seleção — com 500 jogos, `P(máx ≥ 4) ≈ 19,6%` por acaso.

## 1. Achados bloqueantes (P0)

### Funcionais
1. **`predictions.py:165-177`** — `draw_hits` usado antes de ser definido quando `target_hits > 0` → `UnboundLocalError`/500, e nas iterações seguintes compararia acertos do concurso anterior. O bloco de "meta" deve ser removido, não apenas corrigido.
2. **`predictions.py:279-295`** — Lotofácil sempre rejeitada no `/fechamento`: `lottery_name="Lotofácil"` vira `lotofácil`, mas o dict `limits` só tem `lotofacil`; `max_allowed=12 < game_size=15` → 400. Usar `normalize_lottery_key()` de `constants.py`. O fallback `useApi.ts:385` testa `lot.includes('facil')` e também quebra.
3. **`closing_engine.py:32-46, 89-102, 167-182`** — explosão combinatória: `n=20, k=15, c=8` gera ~1,95 bilhão de interseções → timeout/OOM no Render. Usar bitmask + `int.bit_count()` e vetor de contagens, com limites `condition_hits <= game_size`.
4. **`probability.py:11-14`** — falta o primo 53 (21 em vez de 22). 0,17% dos jogos da Mega e 0,34% da Quina classificados de forma diferente.
5. **`closing_engine.py:26-29` / `predictions.py:303-313`** — garantias inválidas aceitas (`guarantee > condition_hits` retorna `[]` com 200). Validar com 400/ValueError.
6. **`probability.py:538-540`** — fallback final sem dedupe nem validação → duplicatas (reduzem `m/C`).
7. **`ml_predictor.py:202,222,227-235`** — janela de treino 250 vs inferência 300 (*distribution shift*), `step_stride=3` descarta 2/3 dos passos, `p_rid` em escala livre e min-max força 0 e 1 sem calibração. Renomear saída de "probabilidade" para "score"; usar mesmo lookback.
8. **`predictions.py:39` / `models.py:21`** — histórico sem sanitização: valores fora de `1..N`, duplicatas e strings distorcem todos os scores. Criar `validate_draw()` único em todas as entradas.

### Estatística e comunicação
9. **BUG-01 (crítico)** — `probability.py:466-470` (pool top-65% + pesos 0,20–1,15) gera χ² = 2.236,2 (gl 59; crítico 77,93) contra 85,1 do baseline com os mesmos filtros; TV = 0,439. 100% das dezenas vêm do pool. Adicionar modo `uniform` como padrão: `random.sample` sem reposição + dedupe por `set`.
10. **BUG-02 (crítico)** — "meta de acertos", "jogos mais pontuados" e "prêmios obtidos" são evidência inválida (viés de seleção). Remover do payload de métricas ou rotular como demonstração com aviso inequívoco.
11. **BUG-03/04/05/06** — seed não configurável, linguagem preditiva sem odds, scores min-max chamados de probabilidade, backtest sem baseline/IC/expectativa hipergeométrica.

### Dados e segurança
12. **`historical_loader.py:130,247`** — `verify=False` desliga TLS; MITM pode injetar dezenas falsas. Remover, fixar fonte do GitHub por commit SHA + sha256, restringir redirects a hosts allowlist.
13. **Dados divergentes** — frontend `mockData.ts:14-83` diz "DADOS HISTÓRICOS REAIS" mas concurso 2740 tem dezenas/datas diferentes do seed do backend; 295 registros do seed sem `source_reference`. Rotular mock como fictício, nunca usá-lo para conferência/backtest; exigir proveniência e checksum.
14. **`api.py:31-46`** — CORS `allow_origin_regex` para qualquer `*.vercel.app` com `allow_credentials=True`. Substituir por origens explícitas.
15. **`collections.py:16-184`** — coleções globais sem autenticação (IDOR/BOLA) e `str(e)` em respostas. Filtrar por `owner_id`, mensagens genéricas + correlation id.
16. **`ClosingPage.tsx:185-192`** — curva de cobertura fabricada (`(i/total)*85+15`); pós-filtro pode anular a garantia exibida. Usar `ClosingEngine.get_coverage_curve` e recalcular após filtro.
17. **`results.py:12-17,37-49` / `constants.py:54-55`** — `strict=False` devolve Mega-Sena para qualquer nome; `limit=-1` devolve o banco todo; `ilike` sem escape. Tornar `strict=True`, `Query(ge=1, le=500)`, comparação exata.
18. Backtest aceita 5.000 concursos × 50 jogos sem rate limit → DoS/custo em serverless. Limitar e aplicar `slowapi`.

## 2. Sugestões priorizadas

### P0 — honestidade, correção, reprodutibilidade (~1,5 dia)
- Novo `backend/app/services/odds.py` com funções puras: `combinatorial_odds`, `hit_probability`, `cumulative_hit_probability` (`math.comb`). Única fonte de odds do sistema.
- Modo `uniform` padrão em `probability.py`, com `seed` local (`random.Random(seed)`); manter heurísticos como `curated`/ilustrativo e avisar que filtros reduzem cobertura (não a chance por jogo).
- Remover `target_hits`/`_target_search`/`top_games` do backtest; corrigir o bug de `draw_hits` apenas se a feature for mantida como demonstração.
- Corrigir normalização da Lotofácil no `/fechamento`, lista de primos, validação de garantias e dedupe do fallback.
- Renomear copy: "Gerador de Jogos", "Estilo de seleção", "Jogo válido", "Simulador Histórico"; exibir odds reais e aviso de independência em todas as telas.
- Marcar `data_source: 'api' | 'offline'` nas respostas; avisar quando nenhum modelo foi executado.
- Testes: seed → mesma saída, jogos distintos, domínio `1..N`, odds vs `math.comb`, hipergeométrica soma 1, `target_hits` sem exceção.

### P1 — validação e qualidade (~2,5 dias)
- Novos `diversity.py` (seleção gulosa/QUBO de cobertura, maximin) e `calibration.py` (observado vs esperado, IC de Wilson, qui-quadrado).
- Backtest walk-forward com braço `uniform` pareado, mesma seed; Wilcoxon signed-rank, IC 95%, correção Benjamini-Hochberg, `leakage_checks`.
- Testes estatísticos: χ² de uniformidade (N≥5.000), KL vs uniforme, TV vs baseline filtrado, autocorrelação lag 1..5, Monte Carlo com N≥100.000 comparando a `random.sample`.
- Sanitização de histórico, proveniência dos dados, TLS/CORS/autenticação de coleções, rate limit.
- Reescrever `ClosingPage` para usar a cobertura real do backend e recalculá-la após filtros.
- Corrigir `closing_engine` com bitmask e objective explícito `min |apostas|` sujeito a cobertura total.

### P2 — transparência e evolução (~1 dia + opcional)
- `GET /api/v2/odds/{lottery}` (denominadores como string), rodapé com odds, README com seção "Limites probabilísticos", aviso de jogo responsável 18+.
- **Quântico legítimo (opcional):** QRNG (ANU/ID Quantique) apenas como fonte de entropia auditável/seed; QUBO (`dimod` + `dwave-neal`/`pyqubo`) apenas para otimização de cobertura/diversidade, comparado contra a seleção gulosa atual. Nunca para escolher "o número vencedor".
- Persistência em Postgres em produção (disco do Render é efêmero), jobs assíncronos para backtest se p95 > 5s.

## 3. Métricas para o dashboard de backtest

- TV e χ²/gl da marginal do gerador vs baseline filtrado, com IC bootstrap e linha de referência em 0.
- Gráfico de `z_i = (O_i−E_i)/√E_i` por dezena, banda ±2.
- Jogos únicos / jogos gerados; sobreposição média; % de dezenas do pool (esperado ≈65%).
- Acertos exatos `j` com IC Wilson contra a linha hipergeométrica (separar "exatamente j" de "≥ j").
- Diferença pareada motor−baseline com IC bootstrap; odds `1/C`; custo `m × preço`; `P(≥j com m) = 1−(1−p)^m`.
- Texto fixo: **"Nenhum algoritmo altera 1/C(N,k)."**

**Limitação de poder declarada:** detectar diferença de 0,02 na taxa de "≥4 acertos" (p ≈ 4,35×10⁻⁴) exigiria ~8,5 milhões de jogos. O teste primário deve ser margem/independência/calibração, não "quantas quadras o modelo acertou".

## 4. Referências e fontes

- Skill do projeto: `.opencode/skills/loteria-probabilidade/SKILL.md`
- Odds: `.opencode/skills/loteria-probabilidade/references/odds.md`
- Quântico (adotável vs pseudociência): `.opencode/skills/loteria-probabilidade/references/metodos-quanticos.md`
- Evidência de imprevisibilidade: ML 6/49 romena (2.510 concursos, frequency/Markov/MLP/RF ≈ acaso); Haigh 1997; Kim 2026 (6/45, 1.234 concursos); QRNG Ma et al. 2016; NIST SP 800-22; SEP *Quantum Logic and Probability Theory*.

## 5. Validação em produção (26/11/2026)

Teste real em `https://frontend-delta-six-13.vercel.app/`, backend `https://lotopredict-api.onrender.com` online. Nenhum erro de console. Lighthouse: acessibilidade **0,68**, SEO **0,75**, boas práticas 1,0 — falhas em botões sem nome acessível, contraste e zoom bloqueado (`user-scalable=no`).

| Funcionalidade | Resultado observado | Achado |
|---|---|---|
| Dashboard | 4 abas e 3 loterias funcionam; "Todo Histórico" traz 300 concursos desde 16/09/2022 | Rótulo enganoso: não é todo o histórico |
| Gerador | 4 estratégias × 3 loterias OK; 5 jogos, todos "Aprovado" | Nenhuma odds exibida; "Aprovado" sugere validação estatística |
| Fechamento — Lotofácil | 15 dezenas permitidas pela UI → API 400: "limite ... é de 12 números (você enviou 15)" | Bug de acento confirmado em produção |
| Fechamento — Mega-Sena | 12 dezenas → 46 apostas; pós-filtro removeu **46/46** ("Filtrados (0)") e a tela ainda diz "Garantia: Mínimo de 5 pontos" | Garantia anulada sem aviso |
| Fechamento — Quina | 10 dezenas → 21 apostas; 21 removidas pelo filtro, garantia ainda exibida | Idem |
| Curva de cobertura | 46 apostas: 1x=17%, 20x=52%; 21 apostas: 1x=19%, 20x=96% | Confere com `(i/total)*85+15` — fabricada no cliente |
| Backtest | 100 concursos / 500 apostas: 51% zero, 38,4% um, 9,6% dois, 1% três acertos | Sem baseline hipergeométrico nem IC |
| Backtest + "Meta de acertos" | Meta 4: "atingida em 1 jogo"; concursos testados caiu de 100 para 20 silenciosamente | Viés de seleção em produção |
| Coleções | Salvamento apenas em `localStorage` (zero requisições à API); conferência usa concurso 2740 de 24/06/2026 sem consultar API, com backend online | UI promete "conferência automática contra a Caixa", mas usa dados fictícios do mock |

Uma coleção de teste (`TESTE-OpenCode-2026-11-26`) foi criada e removida ao final; nenhum dado remoto foi alterado.

## 6. Sinergias entre funcionalidades (refinamento honesto)

**Premissa:** nenhuma combinação de funcionalidades aumenta `1/C(N,k)`. O que as sinergias melhoram é **qualidade da amostragem, cobertura condicional de premiações menores, auditabilidade e validação**. É aqui que reside o "refinamento de resultados" defensável.

| Origem → Destino | Mecanismo | Ganho real | Risco a evitar |
|---|---|---|---|
| **Dashboard → Gerador** | Usar frequência/calor/tendências para medir a marginal gerada e **inverter** o viés (amostragem com pesos inverse-frequency até χ² ficar abaixo do crítico) | Gerador representativo, não concentrado em 39 dezenas | Apresentar isso como "previsão" — é controle de qualidade |
| **Fechamento → Gerador** | Novo modo "cobertura": usar `closing_engine`/QUBO para escolher jogos que garantem `≥t` acertos **condicionais** a um subconjunto de dezenas | Objetivo mensurável (nº de apostas, cobertura de subsets); legítimo uso de annealing | Prometer aumento da chance da sena |
| **Gerador → Coleções** | Salvar `seed`, `estratégia`, `snapshot_id`, `odds` e timestamp junto com os números | Auditabilidade: permite reconstruir e conferir cada jogo depois | Coletar só números, como hoje |
| **Coleções → Backtest** | Usar a carteira salva como conjunto fixo de apostas no backtest, com braço uniforme pareado e IC | Avalia exatamente os jogos que o usuário pretende jogar, em vez de jogos recém-gerados | Selecionar jogos que já acertaram (viés) |
| **Backtest → Dashboard** | Substituir "Premiações Obtidas" por distribuição observada vs hipergeométrica, com banda de IC 95% | Leitura estatisticamente correta | Mostrar contagem bruta sem expectativa teórica |
| **Fechamento → Coleções** | Recalcular cobertura **após** o pós-filtro e gravar a garantia efetiva; bloquear filtro que anule a garantia | Elimina o caso real observado (46/46 removidos com garantia ainda na tela) | Exibir garantia teórica após filtragem |
| **Backtest + Dashboard → Gerador** | Loop de QA: se χ²/KL do lote gerado estourar o limite, descartar o lote e gerar com outra seed | Uniformidade verificável por execução | Escolher a seed "que mais acerta" — isso é p-hacking |

### Plano refinado (incremento sobre P0–P2)

- **P0.5 (novo, imediato):** desabilitar o pós-filtro do fechamento quando ele reduzir a cobertura abaixo da garantia anunciada; corrigir o limite da Lotofácil; fazer a conferência de coleções consultar a API (com aviso explícito quando usar dados locais); renomear "Todo Histórico" para "Últimos 300".
- **P1.5 (novo):** implementar o modo "cobertura" no gerador reaproveitando `ClosingEngine` e gravar metadados de geração nas coleções; adicionar botão "Backtestar esta coleção".
- **P2.5 (novo):** corrigir acessibilidade (nomes de botões, contraste, remover `user-scalable=no`, meta description) — Lighthouse a11y de 0,68 para ≥0,90.

## 7. Execução realizada (26/11/2026)

### Implementado
- **P0.5** — `/fechamento` usa `normalize_lottery_key` (Lotofácil aceita 15/20 dezenas); garantias inválidas rejeitadas; `GET /lottery/{lot}/latest` e conferência de coleções via API com aviso explícito no modo demonstrativo; "Todo Histórico" renomeado para "Últimos 300".
- **P0** — `app/services/odds.py` + `GET /lottery/{lot}/odds` (odds exatas, denominadores inteiros); modo `uniform` como padrão em `/predict` e `/backtest`, com `seed` e jogos distintos; estratégias desconhecidas rejeitadas; sanitização do histórico; `draw_hits` e a "meta de acertos" removidos do backtest; backtest passou a devolver `expected_distribution` (hipergeométrica) e aviso sobre viés de seleção.
- **P1 (parcial)** — cobertura de fechamento real (`POST /fechamento/coverage`, `GET /fechamento/coverage-curve`) substituindo a curva fabricada; pós-filtro que zera a cobertura agora exibe aviso e reexibe todos os jogos; `validate_draw` parcial em `/predict`; `limit` validado e `strict=True` em `/stats`; novos testes de odds/uniformidade/fechamento.
- **Comunicação/UI** — Gerador mostra odds reais e "Jogo válido"; rótulos preditivos renomeados em Gerador, Backtest, Dashboard e Fechamento; "Observado × esperado" no backtest; rodapé de jogo responsável 18+; título/viewport/meta description corrigidos.

### Verificação
- Backend: **18 testes unittest OK** (7 antigos + 11 novos).
- Frontend: `npm run build` **OK**.
- Navegador local (dev server + backend): gerador uniforme com odds, Lotofácil 15 dezenas gerando sem 400, curva de cobertura real, backtest sem "meta" e com baseline, coleções conferidas contra o último concurso da API. Coleção de teste criada e removida.

### Pendente (não executado nesta rodada)
- P1 completo: `diversity.py`, `calibration.py`, comparação pareada com Wilcoxon/IC/bootstrap, correção integral do `closing_engine` com objetivo `min |apostas|` e corrida do annealing, rate limiting, CORS/autenticação de coleções, `verify=False` nos scrapers.
- P2: `GET /api/v2/odds`, README com limites probabilísticos, Postgres em produção, QRNG/QUBO opcionais.

> As alterações estão no repositório local; o site em Vercel continua com a versão anterior até um novo deploy. Para publicar: fazer deploy do backend (Render) e do frontend (Vercel).

## 8. Rodada 2 — P1 restante (26/11/2026)

### Implementado
- **Estatística pareada** (`services/calibration.py`): `observed_vs_expected` (χ², KL, IC de Wilson por faixa), `paired_bootstrap_ci` e `sign_flip_p_value` (teste de permutação, sem dependência de scipy). Backtest aceita `?compare=true` e devolve `comparison` com média das diferenças, IC 95% e p-valor contra o braço uniforme com a mesma seed por concurso.
- **Diversidade** (`services/diversity.py`): `select_diverse_games` (maximin/overlap) e `pair_coverage`. `/predict?diversify=true` aplica a seleção e reporta pares distintos (documentado como não preditivo).
- **Fechamento**: `refine_with_simulated_annealing` corrigido — não para mais quando a solução inicial já cobre 100%, usa bitmask e aceita remoções que preservam cobertura para reduzir o número de apostas.
- **Segurança**: CORS sem regex curinga e sem credenciais, origens extras via `CORS_EXTRA_ORIGINS`; rate limit por IP em `/backtest` e `/fechamento`; `verify=False` removido dos carregadores históricos; validação de dezenas (`validate_draw`); mensagens genéricas de erro em coleções; `.dockerignore`.
- **Acessibilidade**: foco visível global (`:focus-visible`) em `index.css`.

### Verificação
- Backend: **26 testes unittest OK** (8 novos).
- Frontend: `npm run build` **OK**.

### Ainda pendente
Autenticação/owner_id nas coleções, `GET /api/v2/odds`, README de limites, Postgres em produção, QRNG/QUBO opcionais e auditoria completa de Lighthouse após deploy.

