---
name: Metodologia Probabilística de Loterias
description: Use ao analisar, refinar ou validar o gerador de jogos, as odds ou o backtest do app de loterias. Garante honestidade estatística, cálculo combinatório correto e detecção de vieses.
---

# Metodologia Probabilística de Loterias

## 1. Verdade fundamental (não negociável)

Cada concurso é um evento independente. A probabilidade de acertar **todos** os números com um único jogo é `1 / C(N, k)`, onde `N` é o total de números e `k` a quantidade sorteada. Isso é uma constante combinatória: **nenhum modelo, IA ou técnica quântica a aumenta**.

Ao avaliar qualquer proposta de "melhorar as chances", comece por aqui. Se a proposta prometer prever o próximo concurso, rejeite-a.

## 2. O que é legítimo otimizar

- **Não piorar que o aleatório**: garantir amostragem uniforme sem reposição, sem viés de ordem, sem duplicatas indesejadas e sem dependência espúria de "números quentes/frios".
- **Calibragem**: se o sistema fornece escores, eles devem refletir frequências empíricas sem overfitting; verifique calibração (ex.: reliability diagram, Brier score) e divergência KL em relação à uniforme.
- **Diversidade controlada da carteira**: quando o usuário gera vários jogos, evitar que todos compartilhem os mesmos números (isso não aumenta a chance de acertar todos, mas evita redundância e melhora cobertura de cenários).
- **Correção de bugs de pipeline**: data leakage, treinar e validar no mesmo concurso, ordenação temporal errada, valores impossíveis vindos de scraping, arredondamentos e normalizações.
- **Comunicação honesta das odds** e validação estatística (Monte Carlo, qui-quadrado, testes de independência).

## 3. O que rejeitar (pseudociência / placebo)

- "Números atrasados", "quentes/frios", "lei dos pequenos números" aplicada a previsão.
- Alegação de que IA/ML/quantum "descobre padrões" em sorteios independentes.
- Uso de QRNG como se gerasse números "mais sortáveis" — QRNG gera entropia de alta qualidade, não previsão.
- Otimização quântica (annealing/QUBO) para "escolher os números vencedores". Não há função objetivo mensurável para isso.

Usos quânticos **válidos**: QRNG como fonte de aleatoriedade auditável; QUBO/annealing para problemas de otimização combinatória genuína (cobertura de combinações, diversidade, alocação), nunca para prever o sorteio.

## 4. Fluxo de trabalho

1. Leia `references/odds.md` e confirme a modalidade (`app/core/constants.py`).
2. Rastreie o dado: scraper → banco → serviços de probabilidade/ML → rota → frontend.
3. Identifique onde a geração pode divergir da uniforme (`random.sample` correto? seed? ordenação?).
4. Verifique vazamento temporal: o modelo usa somente concursos **anteriores** ao concurso previsto?
5. Proponha mudança com `arquivo:linha`, risco e teste de regressão.
6. Valide com `qa`: Monte Carlo com N amostras, qui-quadrado de uniformidade, comparação com baseline aleatório e intervalo de confiança.
7. Comunique odds reais na interface; nunca prometa "alta chance de acertar todos".

## 5. Checklist de validação

- [ ] A amostragem é sem reposição e uniforme?
- [ ] A seed é configurável e a geração reproduzível para testes?
- [ ] Nenhum dado do "futuro" entra no treino/validação?
- [ ] Duplicatas e valores fora do intervalo são rejeitados?
- [ ] As odds exibidas batem com `C(N,k)`?
- [ ] Há teste comparando o gerador com `random.sample` puro?
- [ ] A UI deixa claro que a chance é combinatória e fixa?

## 6. Arquivos do projeto

- Especificações: `lotopredict-engine/backend/app/core/constants.py`
- Geração/probabilidade: `app/services/probability.py`, `ml_predictor.py`, `closing_engine.py`
- Rotas: `app/api/routes/predictions.py`, `results.py`
- Testes: `lotopredict-engine/backend/tests/test_engine.py`
- Frontend: `frontend/src/pages/GeneratorPage.tsx`, `BacktestPage.tsx`, `DashboardPage.tsx`
