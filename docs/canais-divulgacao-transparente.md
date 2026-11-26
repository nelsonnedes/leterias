# Canais de conteúdo útil + divulgação transparente do LotoPredict

Data da pesquisa: 26/11/2026
Site: https://frontend-delta-six-13.vercel.app/

Escopo desta entrega: **apenas pesquisa e redação**. Não criei contas, não fiz login, não publiquei nada, não enviei nenhum formulário e não respondi a perguntas de terceiros. Os rascunhos abaixo são para o titular publicar, em primeira pessoa, com disclosure.

> Os rascunhos assumem que quem publica é o próprio autor ("criei"). Se outra pessoa publicar, troque para "o autor criou" e mantenha o disclosure.

---

## 1. Princípios que valem para todos os canais (não negociáveis)

- Cada concurso é independente. Com um jogo, `P(todos) = 1 / C(N, k)`:
  - Mega-Sena (60, 6): **1 em 50.063.860**
  - Lotofácil (25, 15): **1 em 3.268.760**
  - Quina (80, 5): **1 em 24.040.016**
- A única alavanca real é `m` (jogos distintos): `P(pelo menos um) = m / C(N,k)`, com custo proporcional. **Nenhum algoritmo, IA ou método quântico aumenta esse valor.**
- O que é defensável dizer: amostragem uniforme sem reposição, sem duplicatas, calibração de scores, cobertura condicional de faixas menores em fechamentos, auditoria/comparação com a hipergeométrica.
- **Não dizer**: "IA prevê números", "números quentes/atrasados", "aumento de probabilidade", "sistema infalível", "prêmios obtidos como prova", depoimentos de usuários inventados.
- Sempre incluir: (a) disclosure de autoria, (b) "sem afiliação com a Caixa/operador", (c) conteúdo informativo/de entretenimento para maiores de 18 anos.
- **Antes de publicar:** conferir se a versão em produção corresponde ao que o texto descreve. O documento `docs/analise-e-plano-refinamento-gerador.md` registra que as correções estavam no repositório local e que o site em Vercel continuava com a versão anterior até um novo deploy. Se algo ainda não estiver no ar, use "estou desenvolvendo..." em vez de "o site mostra...".

Modelo de disclosure curto (adaptar):

> Divulgação: sou o autor do LotoPredict. É um projeto pessoal gratuito, sem afiliação com a Caixa Econômica Federal nem com qualquer operador de loteria. É entretenimento informativo para adultos e não aumenta a chance de acertar o prêmio principal.

---

## 2. Quora

- **URL do canal:** https://www.quora.com/ (responder perguntas existentes; Spaces: https://www.quora.com/spaces)
- **Regras oficiais relevantes:**
  - A resposta deve responder à pergunta; autoria/afiliação relevante deve ser declarada explicitamente na resposta **ou** na credencial exibida; links de afiliados são proibidos.
  - Autopromoção só é permitida como parte de uma resposta direta e útil; o "gist" da resposta precisa ser entendido sem sair do Quora, senão pode ser recolhida.
  - Spam inclui respostas irrelevantes, conteúdo repetido em várias perguntas e promoção excessiva do mesmo produto.
  - Cada Space pode ter regras mais restritivas; não contribuidores podem enviar posts para Spaces que aceitam submissões, sujeitos à aprovação de admins. Perguntas feitas em um Space só podem ser respondidas por contribuidores do Space.
- **Exige conta?** **Sim.** É necessária conta para responder; a política de nomes exige nome real completo. A credencial do perfil pode conter o disclosure.
- **Onde focar:** perguntas já existentes sobre probabilidade, estatística, machine learning, loterias e desenvolvimento web. Evitar criar uma pergunta apenas para promover o projeto e evitar responder a mesma pergunta com o mesmo texto em vários lugares.
- **Risco:** baixo se a resposta for realmente explicativa e o link aparecer uma única vez, no final.

### Rascunho A — resposta no Quora (inglês; para pergunta tipo "Can AI predict lottery numbers?")

```text
Short answer: no. Every draw is independent, so the probability of matching all numbers with one ticket is 1 / C(N, k). Mega-Sena (60 numbers, choose 6) is 1 in 50,063,860; Lotofácil (25, choose 15) is 1 in 3,268,760; Quina (80, choose 5) is 1 in 24,040,016. No model, "hot number" chart or quantum-sounding label changes those denominators. With m distinct tickets your chance of at least one jackpot hit is m / C(N,k) — and you pay m times. That is the only real lever.

What software can honestly do is quality control: sample uniformly without replacement, remove duplicate tickets, and — for a "closed" set — say clearly that any coverage guarantee applies only to smaller prize bands inside the subset you chose. If a tool prints scores, compare them with observed frequencies (calibration) instead of trusting the word "probability".

Disclosure: I built a small personal project, LotoPredict, to explore exactly this; it is meant to show the combinatorial odds and to compare observed hits with the hypergeometric expectation. It's my own project, not affiliated with any lottery operator, and it is entertainment — not a way to increase your chances: https://frontend-delta-six-13.vercel.app/
```

### Rascunho B — versão em português (para Spaces/perguntas em pt-BR)

```text
Resposta curta: não. Cada concurso é independente e a chance de acertar todos os números com um jogo é 1/C(N,k): 1 em 50.063.860 na Mega-Sena, 1 em 3.268.760 na Lotofácil e 1 em 24.040.016 na Quina. Nenhum modelo ou lista de "números quentes" altera esses denominadores. Com m jogos distintos, a chance de pelo menos um acertar a sena é m/C(N,k), e você paga m apostas.

O que um programa pode fazer de útil é controle de qualidade: amostrar uniformemente sem reposição, evitar duplicatas e deixar claro que uma garantia de fechamento vale apenas para faixas menores dentro do conjunto escolhido. Scores só devem ser chamados de probabilidade se passarem por calibração.

Divulgação: sou o autor do LotoPredict, projeto pessoal que criei para estudar e exibir essas odds. Não tenho afiliação com a Caixa nem com operadores; é entretenimento para adultos e não aumenta a chance de ganhar: https://frontend-delta-six-13.vercel.app/
```

---

## 3. There's An AI For That (TAAFT)

- **URL:** https://theresanaiforthat.com/submit e https://free.theresanaiforthat.com/get-featured/ (Termos: https://free.theresanaiforthat.com/terms/)
- **Regras observadas:** aceita ferramentas de IA, GPTs e influenciadores de IA (não humanos); revisão manual; as informações enviadas devem ser precisas, completas e não enganosas; proibidos spam, autopromoção manipulativa, engajamento falso e conteúdo de baixa qualidade/irrelevante; os termos pedem conteúdo em inglês. Há taxa única: no momento da checagem apareciam opções de US$ 49 (listing) e US$ 437 (listing + newsletter); reembolso automático se o tool não for publicado por política editorial. O bônus de US$ 300 em PPC ("launch first") exige que a ferramenta **não** tenha aparecido em outra plataforma antes do lançamento — é condição do bônus, não regra geral.
- **Exige conta?** **Sim.** A página de envio exibe "Sign in to continue. To prevent spam, some actions require being signed in"; cadastro gratuito (Google/Facebook).
- **Enquadramento do LotoPredict — atenção:** o gerador padrão é aleatório uniforme; o modo de ML é ilustrativo. **Não apresente como "IA que prevê sorteios"**: isso seria enganoso e viola os termos. Só faça submit se descrever a ferramenta como educativa/probabilística, com o modo de IA claramente rotulado como ilustrativo e não preditivo.
- **Risco:** médio. Se o editor entender que não há uso de IA relevante, pode recusar (com reembolso, conforme a página).

### Rascunho — descrição de listing (inglês)

```text
LotoPredict — honest lottery odds and unbiased ticket generation

LotoPredict is a small educational tool I built for Mega-Sena, Lotofácil and Quina. It shows the real combinatorial odds on screen (1 in 50,063,860; 1 in 3,268,760; and 1 in 24,040,016 for a single ticket) and lets you compare observed hit counts with the hypergeometric expectation. The default mode samples uniformly without replacement and removes duplicates; the illustrative "frequency / delay / ML-style" modes only change how a ticket is composed — they are explicitly labelled as not predictive. There is also a coverage view for closed sets, with the limitation stated plainly: it targets smaller prize bands inside a chosen subset and does not increase the jackpot odds.

Disclosure: I'm the creator of this project. It's free, personal, and not affiliated with any lottery operator. It does not improve anyone's chance of winning and is intended for adults and entertainment. https://frontend-delta-six-13.vercel.app/
```

---

## 4. Futurepedia

- **URL:** https://www.futurepedia.io/ ; páginas oficiais: https://www.futurepedia.io/editorial-guidelines , https://www.futurepedia.io/terms-of-service , https://www.futurepedia.io/claim-your-listing , https://www.futurepedia.io/update-a-tool
- **Regras oficiais:** "we accept AI tools only"; não aceita NSFW, ferramentas de dating/romance, newsletters de IA nem outros diretórios; submissões passam por aprovação editorial; avaliação humana, sem venda de posições e sem esconder limitações da ferramenta; taxas são não reembolsáveis, exceto recusa por política editorial.
- **Exige conta?** As páginas mostram "Sign In"/"Get Started Free"; os formulários parecem ser hospedados em HubSpot. **Confirme no formulário antes de pagar** — não consegui verificar um fluxo completo sem iniciar sessão.
- **Situação em 26/11/2026:** `/submit-tool`, `/basic` e `/verified` retornaram **404** no acesso direto (o conteúdo aparece em índice de busca, com menção a listing verificado de US$ 497). Canais ativos confirmados: `/claim-your-listing` (reivindicar listing já existente) e `/update-a-tool` (corrigir dados).
- **Enquadramento do LotoPredict — atenção:** a linha editorial é "ajudar as pessoas a trabalhar melhor com IA" e aceitar apenas ferramentas de IA. Um gerador de números de loteria **não é "IA para trabalho"** e dificilmente passaria na curadoria. Recomendação: **não pagar listing verificado sem antes perguntar à editoria** se o caso seria aceito.
- **Risco:** alto de recusa; o rascunho abaixo é para uso apenas se o titular confirmar que há interesse editorial.

### Rascunho — pitch curto para contato/formulário (inglês)

```text
A small probability-education web app I built (LotoPredict) for Mega-Sena, Lotofácil and Quina. Its purpose is transparency: it shows 1/C(N,k) odds, uses uniform sampling without replacement by default, and offers a backtest that compares observed hits with the hypergeometric baseline. Any ML-style mode is labelled illustrative and non-predictive.

Disclosure: I am the creator; this is my own free personal project, not affiliated with any lottery operator. It does not increase winning chances and is for adults/entertainment only. https://frontend-delta-six-13.vercel.app/
```

---

## 5. "AI36" — não localizado (transparência sobre a lacuna)

Não encontrei um diretório de ferramentas de IA identificável como **AI36**. As buscas retornaram outros contextos (um programa governamental de apoio à adoção de IA, um usuário do GitHub, referências a "AI36" como carimbo de tempo/índice). `ai36.com` e `ai36.ai` não responderam ao acesso. **Por favor, confirme o nome ou a URL exata** antes de incluir este canal no plano.

Enquanto isso, duas alternativas verificadas no mesmo formato (ambas exigem que a ferramenta seja realmente baseada em IA — mesma ressalva do item 3):

### Alternativa 5a — AI Tools Directory

- **URL:** https://aitoolsdirectory.com/submit-tool
- **Regra:** revisão manual; só ferramentas relacionadas a IA; descrição original escrita por humano (texto copiado/gerado por IA é descartado); preço transparente sem taxas ocultas; sem lista de espera; sem produtos cripto; não é garantia de publicação.
- **Exige conta?** Não foi observada exigência de login no formulário; pede dados da ferramenta e do contato. Confirmar no envio.
- **Rascunho:**

```text
LotoPredict is a probability-education tool I built: uniform, duplicate-free ticket generation with the real combinatorial odds displayed (Mega-Sena 1 in 50,063,860; Lotofácil 1 in 3,268,760; Quina 1 in 24,040,016) and a backtest against the hypergeometric expectation. The ML-style mode is illustrative, not predictive.

Disclosure: I created this project; it's free, personal, not affiliated with any lottery operator, and does not improve winning odds. Adults/entertainment only. https://frontend-delta-six-13.vercel.app/
```

### Alternativa 5b — AI Tool (ai-tool.ai)

- **URL:** https://ai-tool.ai/submit-tool.html
- **Regra:** listing básico gratuito; revisão em 2–3 dias úteis; deve ser ferramenta de IA real, online e acessível; sem duplicatas; exige checkbox confirmando "I confirm I am the creator or official representative of this tool and have the right to submit it".
- **Exige conta?** Aparentemente não — formulário com nome/e-mail e confirmação de autoria.
- **Rascunho:** usar o mesmo texto da Alternativa 5a, ajustando o campo "tagline" para: `Honest lottery odds and unbiased ticket generation (educational)`.

---

## 6. Launching Next

- **URL:** https://www.launchingnext.com/submit/ (informações oficiais: https://launchingnext.com/llm-info.html)
- **Regra (texto oficial da página):** "We review submissions every day, and you'll receive an email if we publish your startup." Envio gratuito; upgrade opcional de **US$ 99** para consideração em 1 dia útil (o arquivo `llm-info.html` menciona "Express Approval a partir de US$ 149" — valores podem ter mudado; conferir no checkout). Campos: nome, URL, headline de **5–8 palavras**, descrição até 2.500 caracteres, 5–10 tags, tipo de projeto, gasto de marketing em 90 dias, nome/e-mail e uma conta simples de verificação. Curadoria humana.
- **Exige conta?** **Não** — o formulário pede apenas nome e e-mail (não há login). O checkbox de newsletter está marcado por padrão; desmarque se não quiser receber.
- **Enquadramento:** bom.É um site de lançamento de startups/side projects, e o enquadramento honesto do projeto ("ferramenta educativa com odds transparentes") combina com a proposta.
- **Risco:** baixo (publicação sujeita à revisão editorial).

### Rascunho — headline + descrição (inglês)

```text
HEADLINE (8 words):
Honest lottery odds simulator and unbiased ticket generator

DESCRIPTION:
LotoPredict is a side project I built because lottery tools tend to hide the math. It covers Mega-Sena, Lotofácil and Quina and shows why one ticket is 1 in 50,063,860, 1 in 3,268,760 and 1 in 24,040,016 respectively. The default generator samples uniformly without replacement, rejects duplicates, and can be reproduced with a seed. A backtest view compares observed hit counts against the hypergeometric expectation instead of celebrating "lucky" results, and a closing-set view states plainly that coverage only applies to smaller prize bands inside the chosen subset. Illustrative frequency/delay/ML modes are labelled as composition choices, not prediction.

Disclosure: I'm the maker of LotoPredict. It's a free personal project, not affiliated with any lottery operator, and it does not increase the chance of winning anything. Intended for adults and entertainment. https://frontend-delta-six-13.vercel.app/
```

---

## 7. Uneed

- **URL:** https://www.uneed.best/submit-a-tool (Ajuda: https://help.uneed.best/getting-started/how-to-submit-your-first-product , https://help.uneed.best/common-questions-and-issues/what-we-accept , https://help.uneed.best/common-questions-and-issues/why-your-submission-was-declined)
- **Regra:** começa-se sem conta (nome + URL; robôs leem a página); **cadastro é exigido no fim para salvar**. Conteúdo em **inglês**. Fila gratuita: até ~5 meses; score mínimo de 10 no dia do lançamento para permanecer publicado e 20 para manter o backlink dofollow; opções pagas Fast-track (US$ 19,99) e Skip the Waiting Line (US$ 39,99). A fila gratuita recusa, entre outros: **site sem domínio próprio (ex.: `yourapp.vercel.app`)**, ferramentas "low-effort" (conversores/geradores/calculadoras básicas), "AI wrappers" genéricos, categorias saturadas e produtos não disponíveis em inglês. Recusa total: NSFW, versões falsas de modelos de IA, produtos fechados/por convite, spam e alegações enganosas ("misleading claims").
- **Exige conta?** **Sim, para salvar/publicar** (o início do formulário é sem conta).
- **Enquadramento do LotoPredict — atenção:** a URL atual `frontend-delta-six-13.vercel.app` é um endereço compartilhado do Vercel e o site está em pt-BR. Isso, somado ao risco de ser classificado como "gerador low-effort", torna a **fila gratuita provavelmente inelegível**. Para tentar de forma correta: usar domínio próprio + landing page em inglês, descrever o trabalho de calibração/auditoria (não apenas "gerador de números") ou assumir uma opção paga.
- **Risco:** médio-alto na fila gratuita; baixo se os requisitos acima forem atendidos.

### Rascunho — tagline + descrição rica (inglês)

```text
TAGLINE (58 chars):
Free lottery odds simulator with unbiased ticket generation

DESCRIPTION:
LotoPredict is a small educational project I built to make lottery math visible. It supports Mega-Sena, Lotofácil and Quina and states the exact odds for a single ticket: 1 in 50,063,860, 1 in 3,268,760 and 1 in 24,040,016. The default mode samples uniformly without replacement and removes duplicates; the backtest compares observed hits with the hypergeometric expectation rather than cherry-picking "best" games. Modes based on frequency, delay or an ML-style score are clearly labelled illustrative and non-predictive. Everything is framed as quality control and transparency, never as a way to beat the draw.

Disclosure: I am the creator of this project. It is free, personal, not affiliated with any lottery operator, does not improve anyone's odds, and is for adults/entertainment only. https://frontend-delta-six-13.vercel.app/
```

---

## 8. Peerlist

- **URL:** https://peerlist.io/launchpad ; regras: https://help.peerlist.io/individual/launchpad/guidelines-faqs , FAQ: https://help.peerlist.io/individual/launchpad/frequently-asked-questions-about-spotlight-by-peerlist , posts: https://help.peerlist.io/individual/scroll/what-can-i-post-on-peerlist-scroll , políticas: https://help.peerlist.io/legal/content-policies.md
- **Regra:** **Launchpad:** apenas perfis individuais verificados (nome e foto válidos, não perfil de empresa); projeto adicionado ao perfil com 100% dos campos preenchidos; janela semanal que abre na segunda-feira; ranking por upvotes/comentários/visualizações; **não pedir upvotes**, não fazer DMs em massa nem repostar link; conteúdo original; apenas os 5 primeiros recebem backlink. **Crítico:** o FAQ diz que não podem ser lançados produtos "related or in nature of pornography, vulgarity, **betting, or gambling**". Políticas gerais proíbem alegações enganosas e esquemas do tipo "get rich quick".
- **Exige conta?** **Sim** — perfil verificado para Launchpad; conta também para postar no Scroll.
- **Recomendação:** **não usar o Launchpad** para este projeto sem confirmar antes com o suporte (support@peerlist.io) que um gerador de números de loteria não se enquadra em "betting/gambling". O risco é remoção e suspensão do perfil. O **Scroll com contexto `#show`** é caminho mais seguro: a regra incentiva mostrar trabalho/aprendizados, exige legenda (posts só com link são ocultados/removidos) e permite disclosure natural.
- **Risco:** Launchpad alto; Scroll baixo se o foco for a lição de probabilidade e não a promoção do link.

### Rascunho — post `#show` no Scroll (inglês, com legenda + link)

```text
#show — I spent this week on a small lottery-odds simulator, and the most useful part was the math, not the generator.

1/C(N,k) does not move no matter which model you use: one Mega-Sena ticket is 1 in 50,063,860, Lotofácil is 1 in 3,268,760, Quina is 1 in 24,040,016. So I focused on things you can actually verify: uniform sampling without replacement, no duplicate tickets, and a backtest that plots observed hits against the hypergeometric baseline instead of highlighting "lucky" runs. Any ML-style mode is labelled illustrative and non-predictive.

Disclosure: this is my own project (LotoPredict) — I built it and I'm sharing it here: https://frontend-delta-six-13.vercel.app/ No affiliation with any lottery operator; it does not increase winning chances. Adults/entertainment only.

Happy to answer questions about the sampling tests or the odds math. Feedback welcome — and no upvote requests, per the community rules.
```

### Rascunho opcional de Launchpad — **somente após confirmação com o suporte**

```text
LotoPredict is a probability-education web app I built. It shows exact combinatorial odds for Mega-Sena, Lotofácil and Quina, generates tickets by uniform sampling without replacement, and offers a backtest with an explicit hypergeometric baseline and calibration checks. Any ML-style mode is illustrative and non-predictive.

Disclosure: I'm the sole creator; it's a free personal project, not affiliated with any lottery operator. It's for adults/entertainment and does not improve winning chances. https://frontend-delta-six-13.vercel.app/
```

---

## 9. Checklist final antes de publicar

- [ ] Uma única URL por publicação, preferencialmente no último parágrafo.
- [ ] Disclosure de autoria explícito (obrigatório no Quora) e "sem afiliação com a Caixa/operador".
- [ ] Nenhum depoimento de usuário, número de usuários, conversão ou "prêmio ganho" inventado.
- [ ] Nenhuma frase que sugira aumento de chance; odds sempre como `1/C(N,k)`.
- [ ] Modos ilustrativos (frequência/atraso/ML) descritos como composição, não previsão.
- [ ] Aviso 18+ / jogo responsável.
- [ ] A versão no ar corresponde ao que o texto afirma (ver item 1).
- [ ] Respeitar a regra de cada canal: sem envio em massa, sem pedido de upvotes, sem resposta idêntica em várias perguntas.

---

## 10. Fontes (acessadas em 26/11/2026)

**Quora**
- https://help.quora.com/hc/en-us/articles/9456583756180-Question-and-Answer-Policies
- https://help.quora.com/hc/en-us/articles/360055133711-What-is-Quora-s-policy-on-disclosing-affiliations-in-answers
- https://help.quora.com/hc/en-us/articles/360020402511-Spaces-Frequently-Asked-Questions
- https://help.quora.com/hc/en-us/articles/360043961972-Spaces-Policies
- https://help.quora.com/hc/en-us/articles/360000470623-Do-I-have-to-use-my-real-name-on-Quora-What-is-Quora-s-real-names-policy- (localizado via índice de busca; o acesso direto retornou 404 — conferir se foi movido)

**TAAFT**
- https://free.theresanaiforthat.com/get-featured/ (página oficial lida via espelho de leitura; domínio principal bloqueou acesso direto com 403)
- https://free.theresanaiforthat.com/terms/
- https://theresanaiforthat.com/submit (403 no acesso direto; metadados confirmados via índice de busca)

**Futurepedia**
- https://www.futurepedia.io/
- https://www.futurepedia.io/editorial-guidelines
- https://www.futurepedia.io/terms-of-service
- https://www.futurepedia.io/claim-your-listing
- https://www.futurepedia.io/update-a-tool
- https://www.futurepedia.io/submit-tool , /basic , /verified — 404 em 26/11/2026

**AI36 / alternativas**
- https://aitoolsdirectory.com/submit-tool
- https://ai-tool.ai/submit-tool.html
- ai36.com e ai36.ai — sem resposta; nenhum diretório "AI36" identificado nas buscas

**Launching Next**
- https://www.launchingnext.com/submit/
- https://launchingnext.com/llm-info.html

**Uneed**
- https://www.uneed.best/submit-a-tool
- https://help.uneed.best/getting-started/how-to-submit-your-first-product
- https://help.uneed.best/common-questions-and-issues/what-we-accept
- https://help.uneed.best/common-questions-and-issues/why-your-submission-was-declined

**Peerlist**
- https://help.peerlist.io/individual/launchpad/guidelines-faqs
- https://help.peerlist.io/individual/launchpad/frequently-asked-questions-about-spotlight-by-peerlist
- https://help.peerlist.io/individual/launchpad/how-to-launch-a-project-on-peerlist-launchpad
- https://help.peerlist.io/individual/scroll/what-can-i-post-on-peerlist-scroll
- https://help.peerlist.io/legal/content-policies.md

**Fontes locais do projeto**
- `docs/promocao-e-indexacao.md`
- `docs/analise-e-plano-refinamento-gerador.md`
- `frontend/README.md`
- Skill `.opencode/skills/loteria-probabilidade/` (metodologia probabilística)
