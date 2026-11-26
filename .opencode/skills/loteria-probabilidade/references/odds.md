# Probabilidades combinatórias das modalidades suportadas

Fonte das especificações: `lotopredict-engine/backend/app/core/constants.py`.

| Modalidade   | N (universo) | k (sorteados) | Jogos possíveis C(N,k) | Chance de acertar todos com 1 jogo |
|--------------|--------------|---------------|------------------------|-------------------------------------|
| Mega-Sena    | 60           | 6             | 50.063.860             | 1 em 50.063.860                     |
| Lotofácil    | 25           | 15            | 3.268.760              | 1 em 3.268.760                      |
| Quina        | 80           | 5             | 24.040.016             | 1 em 24.040.016                     |

## Fórmulas

- **Todos os números**: `P = 1 / C(N, k)`.
- **Exatamente j acertos** em um jogo de k números (distribuição hipergeométrica):
  `P(j) = C(k, j) * C(N-k, k-j) / C(N, k)`.
- **Com m jogos distintos**: `P = m / C(N, k)` — **exato**, pois os eventos são mutuamente exclusivos quando os jogos não se repetem. Duplicatas reduzem esse valor.
- **Valor esperado**: `E = P * prêmio - custo`. Não é melhorado por "técnicas de previsão".

## Exemplos (Mega-Sena)

Valores calculados com `math.comb`:

| Faixa | Probabilidade | 1 em |
|-------|---------------|------|
| Exatamente 4 acertos | `C(6,4)*C(54,2)/C(60,6)` | 2.332,35 |
| Exatamente 5 acertos | `C(6,5)*C(54,1)/C(60,6)` | 154.518,09 |
| Exatamente 6 acertos | `1/C(60,6)` | 50.063.860 |
| **4 ou mais** (cumulativo) | soma de 4, 5 e 6 | 2.297,56 |
| **5 ou mais** (cumulativo) | soma de 5 e 6 | 154.042,65 |

Outras modalidades: Lotofácil 11 ou mais ≈ 1 em 9,44; Quina 2 ou mais ≈ 1 em 34,18.

## Interpretação para o produto

Ao gerar `m` jogos, a chance de **pelo menos um** acertar todos é no máximo `m / C(N,k)` (assumindo jogos distintos). A única forma de aumentar essa chance é aumentando `m`, o que aumenta o custo proporcionalmente — nunca alterando a "qualidade" dos números escolhidos.

Qualquer afirmação de que um algoritmo eleva a probabilidade acima desse limite é falsa. O contribuição real do sistema é: evitar jogos duplicados, garantir amostragem uniforme, calcular as odds corretamente e comunicar isso com clareza.
