# Publicação, indexação e descoberta

Data: 26/11/2026
Site: https://frontend-delta-six-13.vercel.app/

## Feito automaticamente (sem conta e sem custo)

1. **Metadados de busca e IA** em `frontend/index.html`:
   - `<title>`, meta description, keywords, `robots`, canonical.
   - Open Graph e Twitter Card.
   - JSON-LD `WebApplication` (Schema.org) com preço 0, idioma pt-BR e lista de funcionalidades.
2. **`robots.txt`** em `frontend/public/robots.txt`: libera Googlebot, Bingbot e bots de IA (GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended), bloqueia apenas `/api/`, e aponta para o sitemap.
3. **`sitemap.xml`** com a URL raiz e `lastmod`.
4. **`llms.txt` e `llms-full.txt`** para descoberta por assistentes de IA, com fatos verificáveis sobre odds e limites probabilísticos.
5. **IndexNow**: chave hospedada em `/bd096fb096d849df8a51f5ea9f5176d1.txt` e URL submetida com sucesso (HTTP 200/202) a:
   - `https://api.indexnow.org/indexnow`
   - `https://www.bing.com/indexnow`
   - `https://yandex.com/indexnow`
   - `https://search.seznam.cz/indexnow`

> Google não aceita IndexNow; o ping de sitemap foi descontinuado (404). Para Google é necessário verificar o site no Search Console com a conta do titular.

## O que precisa de conta do titular (não fiz automaticamente)

Não criei contas em serviços de terceiros usando seu e-mail sem acesso à caixa de entrada — a maioria exige verificação por e-mail/telefone e o uso indevido de e-mail alheio viola os termos de serviço. Também não faço submissões em massa/captcha/spam em diretórios, pois isso pode gerar penalização do domínio.

Passos rápidos (5–10 min cada):

1. **Google Search Console** — https://search.google.com/search-console
   - Adicionar propriedade por domínio ou URL; verificar via arquivo HTML, DNS ou GA.
   - Enviar `https://frontend-delta-six-13.vercel.app/sitemap.xml`.
2. **Bing Webmaster Tools** — https://www.bing.com/webmasters
   - Importar do Google ou verificar; conferir IndexNow e sitemap.
3. **Yandex Webmaster** — https://webmaster.yandex.com
   - Verificar domínio e conferir a submissão via IndexNow.
4. **Diretórios e comunidades** (verificação manual recomendada):
   - Product Hunt — https://www.producthunt.com/posts/new
   - AlternativeTo — https://alternativeto.net/submit/
   - BetaList — https://betalist.com/submit
   - Launching Next — https://www.launchingnext.com/submit
   - SaaSHub — https://www.saashub.com/submit
   - Slant — https://www.slant.co/add
   - Hacker News (Show HN) — https://news.ycombinator.com/submit
   - Reddit (r/lottery, r/webdev, r/ProductPorn) — https://reddit.com/submit

## Texto pronto para divulgação (pt-BR)

**Título:** LotoPredict — gerador gratuito de jogos com odds transparentes

**Descrição curta:**
LotoPredict é um gerador gratuito de jogos da Mega-Sena, Lotofácil e Quina que mostra as odds reais de cada aposta, permite simular jogos contra o histórico e montar fechamentos combinatórios. Sem cadastro, com salvamento local e conferência automática contra o último concurso da Caixa. A proposta é honesta: nenhum algoritmo aumenta a chance combinatória de acertar todos os números — a ferramenta ajuda a montar jogos sem viés e a entender as probabilidades.

**Descrição longa:**
Use o LotoPredict para montar jogos com amostragem uniforme e sem duplicatas, comparar a distribuição de acertos com a expectativa hipergeométrica e gerar fechamentos que cobrem combinações dentro de um conjunto de dezenas. As odds são calculadas com combinações exatas. Os jogos salvos ficam apenas no seu dispositivo e podem ser conferidos contra o concurso mais recente da Caixa. Ferramenta informativa e de entretenimento, para maiores de 18 anos.

**URL canônica:** https://frontend-delta-six-13.vercel.app/
