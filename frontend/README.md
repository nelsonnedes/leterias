# LotoPredict — Frontend

React + TypeScript + Vite + Tailwind. Backend FastAPI em `../lotopredict-engine/backend`.

## Limites probabilísticos (importante)

Cada concurso é um evento independente. A chance de acertar **todos** os números com um jogo é fixa:

| Loteria | Combinações | 1 jogo | 5 jogos distintos |
|---|---:|---:|---:|
| Mega-Sena (60, 6) | 50.063.860 | 1 em 50.063.860 | 1 em 10.012.772 |
| Lotofácil (25, 15) | 3.268.760 | 1 em 3.268.760 | 1 em 653.752 |
| Quina (80, 5) | 24.040.016 | 1 em 24.040.016 | 1 em 4.808.003 |

`P(pelo menos um acertar todos) = m / C(N,k)` para `m` jogos **distintos**. Nenhum algoritmo, IA ou técnica quântica aumenta esse valor; a única alavanca é a quantidade de jogos, com custo proporcional. O modo padrão `uniform` amostra o universo inteiro sem viés; os modos "ilustrativos" (frequência, atraso, ML) apenas mudam a composição dos jogos. O fechamento otimiza cobertura de faixas menores dentro de um conjunto escolhido — não aumenta a chance do prêmio principal.

Ver também `docs/analise-e-plano-refinamento-gerador.md` e `.opencode/skills/loteria-probabilidade/`.

---

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
