# Kit de divulgação transparente — LotoPredict

Data: 26/11/2026 · Site: https://frontend-delta-six-13.vercel.app/

**Escopo:** quatro agentes pesquisaram regras oficiais e redigiram textos. **Nenhuma conta foi criada, nenhum login feito, nenhum formulário enviado e nenhum comentário publicado.** Postar como usuário real, com disclosure e seguindo as regras de cada comunidade, é uma decisão do titular.

## Arquivos do kit

- Este arquivo: prioridades, bloqueios e rascunhos principais.
- `docs/canais-divulgacao-transparente.md` — Quora, diretórios de IA, Launching Next, Uneed, Peerlist (24 KB, com rascunhos completos).
- `docs/promocao-e-indexacao.md` — SEO, robots, sitemap, llms.txt e IndexNow.
- `docs/analise-e-plano-refinamento-gerador.md` — base técnica e probabilística.

## Regras não negociáveis em todos os textos

1. Diga **sempre** que o projeto é seu e que é gratuito, sem afiliação com a Caixa.
2. Diga **sempre**: "não prevê resultados e não aumenta a chance de acertar" — cada concurso é independente.
3. Nunca prometa ganho, lucro, "números quentes" ou vantagem quântica.
4. Nunca invente depoimento, usuário, métrica ou benchmark.
5. Um único link direto, sem encurtador, sem UTM, sem pedido de voto/upvote/DM.
6. Preencha os `[colchetes]` com fatos reais antes de publicar.
7. Confirme as regras no dia da publicação — mudam sem aviso.

## Prioridades

| Prioridade | Canal | Conta | Observação |
|---|---|---|---|
| 1 | **LinkedIn (perfil pessoal)** | Sim | Mais permissivo; conte a história, não faça pitch |
| 1 | **TabNews** (`Pitch:` no título) | Sim | Melhor canal brasileiro; precisa agregar valor técnico |
| 1 | **Reddit r/SideProject** | Sim | Comunidade feita para projetos próprios; ofereça feedback a outros |
| 1 | **Quora** | Sim (nome real) | Responder perguntas existentes com explicação útil + disclosure |
| 2 | **Show HN** | Sim | Título `Show HN: ...`; autor técnico disponível na thread |
| 2 | **Product Hunt** | Sim (pessoal) | Tagline curta, 2+ imagens, sem pedir upvotes |
| 2 | **DEV Community** (`#showdev`, `#portuguese`) | Sim | Não usar artigo escrito por IA para promover projeto próprio |
| 2 | **r/MicroSaaSBR** | Sim | Em pt-BR, com contexto real |
| 3 | Launching Next, AlternativeTo, SaaSHub, BetaList | Varia | Bloqueios: domínio próprio e/ou site em inglês |
| — | r/Lottery | Sim | Só com **aprovação prévia da moderação** |
| — | r/brdev, r/programacao, r/marketing | — | **Não publicar** divulgação; proibido ou restrito a discussão técnica |

**Bloqueio importante:** BetaList, SaaSHub e Uneed recusam subdomínios gratuitos como `*.vercel.app` e/ou exigem domínio próprio. Enquanto o site estiver neste endereço, foque em LinkedIn, TabNews, Reddit, Quora, HN, Product Hunt e DEV.

---

## Rascunho — LinkedIn (pt-BR)

```text
Terminei um projeto pessoal que queria compartilhar por aqui, com transparência: é meu, desenvolvido por mim, gratuito e sem cadastro.

Chama-se LotoPredict (https://frontend-delta-six-13.vercel.app/). A ideia não foi "criar um sistema que acerta loteria" — foi estudar probabilidade e mostrar os números sem mistério. Ele gera jogos da Mega-Sena, Lotofácil e Quina por amostragem uniforme, exibe as odds, traz um simulador histórico comparado ao modelo hipergeométrico e fechamentos com curva de cobertura.

Apesar do nome: ele NÃO prevê resultado e NÃO aumenta a chance de ganhar. Cada concurso é independente. O que a ferramenta faz é deixar a matemática explícita — é entretenimento e estudo, não promessa.

O que mais me desafiou foi [desafio técnico real seu]. Se você trabalha com dados ou ensino, como faria essa comunicação? Adoraria ler comentários.
```

## Rascunho — TabNews (pt-BR)

**Título:** `Pitch: LotoPredict — gerador de jogos com odds transparentes (projeto próprio, sem previsão)`

```markdown
Sou o autor do LotoPredict (https://frontend-delta-six-13.vercel.app/). Trago aqui mais como devlog do que como anúncio: é um projeto meu, gratuito e sem cadastro.

O que ele faz, objetivamente: gera jogos da Mega-Sena, da Lotofácil e da Quina por amostragem uniforme; mostra as odds de cada modalidade; tem um simulador histórico que compara resultados observados com o modelo hipergeométrico; permite fechamentos combinatórios com curva de cobertura. Também guarda coleções localmente e consulta o último concurso da Caixa.

Ponto importante, até por causa do nome: **ele não prevê resultado nenhum e não aumenta a chance de ganhar**. Cada concurso é independente. A ferramenta só deixa explícito o cálculo combinatório que já existe — é entretenimento e estudo de probabilidade.

A decisão técnica que talvez seja útil a quem ler: [conte como você implementou a amostragem uniforme / a hipergeométrica / a curva de cobertura]. Link do repositório: https://github.com/nelsonnedes/leterias

Fico grato por críticas em dois pontos: (1) a correção do cálculo das odds e (2) a clareza da interface para quem não é da área.
```

## Rascunho — r/SideProject (EN)

**Título:** `LotoPredict - Free lottery number generator with transparent odds and a labelled backtest`

```text
Disclosure: I built this, and it's a free tool.

I wanted a lottery tool that didn't imply it could predict a draw, so I made LotoPredict. It generates random combinations, shows the exact combinatorial odds for each game, and includes a historical simulator that is clearly labelled as hindsight — not a forecast. The "fechamentos" view shows how many tickets a coverage needs and what it costs up front.

The lottery is random. Nothing here improves your chance of winning, and the app says so plainly.

Link: https://frontend-delta-six-13.vercel.app/

Feedback I'd really like: is the odds explanation clear to someone who isn't into statistics, and does the backtest risk being read as a prediction? I'm happy to return the favour with feedback on other projects here.
```

## Rascunho — Show HN

**Título:** `Show HN: LotoPredict – real combinatorial odds and a historical lottery backtester`

**Primeiro comentário:**

```text
Full disclosure: I'm on LotoPredict's outreach team, not an independent user; [nome do dev], who worked on the implementation, is here for technical questions. We built this to make combinatorial odds and selection bias explicit, not to predict draws or improve anyone's chances — happy to discuss the math and where the backtest could mislead.

Try it (no signup): https://frontend-delta-six-13.vercel.app/
```

> Se quem postar for o próprio autor, troque por: "I built this and I'm here to answer questions."

## Rascunho — Product Hunt

- **Name:** `LotoPredict`
- **Tagline:** `Real lottery odds, historical backtests, zero hype`
- **Description:** `LotoPredict is a free tool that shows the exact combinatorial odds of lottery bet shapes, replays historical draws, and compares coverage sets ('fechamentos') without selection bias. It does not predict numbers or improve your chances.`
- **Primeiro comentário do maker:**

```text
Full disclosure: I'm on LotoPredict's outreach team, so this isn't an independent review. The goal is to show the math — odds and selection bias — honestly, with no predictions or winning promises; I'd love feedback on the methodology and the UX.
```

## Rascunho — Quora (pt-BR)

```text
Resposta curta: não. Cada concurso é independente e a chance de acertar todos os números com um jogo é 1/C(N,k): 1 em 50.063.860 na Mega-Sena, 1 em 3.268.760 na Lotofácil e 1 em 24.040.016 na Quina. Nenhum modelo ou lista de "números quentes" altera esses denominadores. Com m jogos distintos, a chance de pelo menos um acertar a sena é m/C(N,k), e você paga m apostas.

O que um programa pode fazer de útil é controle de qualidade: amostrar uniformemente sem reposição, evitar duplicatas e deixar claro que uma garantia de fechamento vale apenas para faixas menores dentro do conjunto escolhido.

Divulgação: sou o autor do LotoPredict, projeto pessoal que criei para estudar e exibir essas odds. Não tenho afiliação com a Caixa nem com operadores; é entretenimento para adultos e não aumenta a chance de ganhar: https://frontend-delta-six-13.vercel.app/
```

---

## Regras de ouro para o dia da publicação

1. Poste **como você mesmo**, com seu nome e sua conta.
2. Responda comentários nas primeiras horas — isso pesa mais que o link.
3. Adapte o ângulo para cada comunidade; nunca copie o mesmo texto em várias.
4. Se um post for removido, leia a mensagem da moderação e reformule — não repita em outro canal.
5. Nada de "DM me", votos, upvotes ou depoimento inventado.
