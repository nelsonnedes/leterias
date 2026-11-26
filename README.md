# LotoPredict

[![Release v2.0.0](https://img.shields.io/badge/release-v2.0.0-blue.svg)](https://github.com/nelsonnedes/leterias/releases/tag/v2.0.0)

**Aplicação em produção:** https://frontend-delta-six-13.vercel.app/

Gerador gratuito de jogos da Mega-Sena, Lotofácil e Quina com odds combinatórias transparentes, simulador histórico e fechamentos matemáticos. Sem cadastro, com coleções salvas localmente e conferência contra o último concurso real da Caixa.

## O que o sistema faz

- **Gerador:** modo uniforme padrão (amostragem equiprovável, sem duplicatas e com seed opcional) e modos ilustrativos baseados em estatísticas descritivas. Odds exatas são exibidas para cada modalidade.
- **Simulador histórico:** distribuição observada comparada com a expectativa hipergeométrica, sem "meta de acertos" (isso seria viés de seleção).
- **Fechamentos:** cobertura combinatória de conjuntos de dezenas, com curva de cobertura real, atalhos de preenchimento e quantidade de jogos configurável.
- **Minhas coleções:** jogos salvos no dispositivo e conferência automática com o concurso atual da Caixa (com aviso quando a fonte estiver desatualizada).
- **Grupo de jogos:** jogos de todos os geradores são acumulados e salvos juntos em uma coleção.

## Limite probabilístico

Cada concurso é independente. A chance de acertar todos os números com um jogo é `1/C(N,k)` e **nenhum algoritmo, IA ou técnica quântica a aumenta**. Com `m` jogos distintos, a chance é `m/C(N,k)`. A única alavanca é a quantidade de jogos, com custo proporcional. O projeto é informativo e de entretenimento, para maiores de 18 anos.

## Documentação

- [Análise e plano de refinamento](docs/analise-e-plano-refinamento-gerador.md)
- [Publicação, indexação e divulgação](docs/promocao-e-indexacao.md)
- [Metodologia probabilística](.opencode/skills/loteria-probabilidade/SKILL.md)
- [Frontend](frontend/README.md)

## Executar localmente

```bash
# backend
cd lotopredict-engine/backend
venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000

# frontend
cd frontend
npm install
npm run dev
```
