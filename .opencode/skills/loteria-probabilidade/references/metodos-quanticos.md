# Métodos "quânticos": o que é legítimo e o que é pseudociência

## Veredito

Nenhum mecanismo físico ou computacional — quântico ou clássico — aumenta `1/C(N,k)` de um sorteio independente. "Lógica quântica" é um campo de fundamentos da mecânica quântica (reticulado não-booleano de projetores, Birkhoff & von Neumann 1936); "high-level quantum programming" é abstração de linguagens (Qmod, categorias de Abramsky/Coecke). Nenhum dos dois modela balões sorteados. Prometer previsão com esse jargão é *quantum flapdoodle / snake oil*.

## Adotável (com função objetiva mensurável)

| Recurso | Função real | Não faz |
|---|---|---|
| `random.sample(range(1,N+1), k)` | Amostragem uniforme sem reposição — baseline correto | — |
| `secrets.SystemRandom`, PRNG com seed | Entropia/reproduzibilidade para testes e auditoria | Não melhora previsão |
| QRNG (ANU, ID Quantique Quantis) | Fonte de entropia auditável; seed imprevisível | Não gera "números mais sortáveis" — imprevisibilidade é o oposto de previsão |
| QUBO + `dimod` / `dwave-neal` / `pyqubo` / `dwave-hybrid` | Otimização de cobertura (`covering design`/wheels) e diversidade de carteira (maximin de distância entre jogos) | Não escolhe o resultado do próximo concurso |
| `scipy.stats.hypergeom`, `chisquare`, `entropy(pk, qk)` (KL), Monte Carlo | Auditar viés e calcular odds | Não altera a combinatória |

Formulação QUBO útil para diversidade ( válida, não preditiva):
`min Σ_{g<g'} Σᵢ x_{g,i}·x_{g',i}` sujeito a `Σᵢ x_{g,i} = k`, com `x_{g,i} ∈ {0,1}`.
Compare sempre com a seleção gulosa existente (`probability.py:515-536`) antes de adicionar dependência de hardware. Para instâncias pequenas, simulated annealing clássico já é competitivo.

## Rejeitar

- QKD aplicado a loteria: só distribui chave secreta; ANSSI e NSA descrevem limitações e a NSA não a recomenda.
- "Números quentes/frios/atrasados", lei dos pequenos números, `is_stupid_game` descartando jogos já sorteados (`probability.py:278-286`): falácia do apostador embutida em código.
- ML/IA "descobrindo padrões" em sorteios independentes: estudo com 2.510 concursos da loteria romena 6/49 mostrou frequência, Markov, MLP e random forest indistinguíveis do acaso.
- Platt/isotonic nos scores atuais: calibrar ruído apenas reajusta overfitting; em loteria o "calibrado correto" é a uniforme.
- Filtros de paridade/soma/primos/quadrantes como "aumento de chance": reduzem o espaço amostral (placebo e potencialmente enviesantes).

## Edge legítimo (economia comportamental, não física)

Haigh (1997) mostrou que o que não é aleatório são as **escolhas dos apostadores** (datas, sequências, números baixos, padrões visuais). Evitar combinações populares pode melhorar o **retorno esperado condicional ao acerto**, nunca a chance de acertar. Isso deve ser comunicado como mera preferência, não como vantagem preditiva.

## Fontes-chave

- QRNG: https://www.nature.com/articles/npjqi201621 · https://arxiv.org/html/2004.04996v2
- Auditoria Quantis: https://epjquantumtechnology.springeropen.com/articles/10.1140/epjqt/s40507-022-00136-z
- QKD (ANSSI): https://messervices.cyber.gouv.fr/guides/en-should-quantum-key-distribution-be-used-secure-communications
- QKD (NSA): https://www.nsa.gov/Cybersecurity/Quantum-Key-Distribution-QKD-and-Quantum-Cryptography-QC
- QUBO/SA benchmark 2025: https://www.nature.com/articles/s41534-025-01020-1 · https://github.com/dwavesystems/dwave-neal
- Imprevisibilidade (6/49 romena, 2.510 concursos): https://link.springer.com/chapter/10.1007/978-3-032-30518-3_23
- Haigh 1997: https://rss.onlinelibrary.wiley.com/doi/10.1111/1467-985X.00056
- Quantum logic (SEP): https://plato.stanford.edu/entries/qt-quantlog
- Mau uso de jargão quântico: https://epjquantumtechnology.springeropen.com/articles/10.1140/epjqt/s40507-025-00403-9
- NIST SP 800-22: https://www.nist.gov/publications/statistical-test-suite-random-and-pseudorandom-number-generators-cryptographic
