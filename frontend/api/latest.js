// Proxy serverless (Vercel) para o último concurso da Caixa.
// O backend no Render nem sempre consegue alcançar servicebus2.caixa.gov.br.

const ENDPOINTS = {
  megasena: 'megasena',
  lotofacil: 'lotofacil',
  quina: 'quina',
};

export default async function handler(request, response) {
  const requested = String(request.query.lottery || 'megasena').toLowerCase();
  const endpoint = ENDPOINTS[requested] || 'megasena';

  let data;
  const caixaUrl = `https://servicebus2.caixa.gov.br/portaldeloterias/api/${endpoint}`;
  try {
    const upstream = await fetch(caixaUrl, { headers: { 'User-Agent': 'LotoPredict/2.0' } });
    if (!upstream.ok) throw new Error(`Caixa respondeu HTTP ${upstream.status}`);
    data = await upstream.json();
  } catch (directError) {
    // A Caixa bloqueia IPs de datacenter; usa o leitor Jina como ponte.
    const bridge = await fetch(`https://r.jina.ai/${caixaUrl}`);
    const text = await bridge.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw directError;
    data = JSON.parse(text.slice(start, end + 1));
  }

  try {
    const numbers = (data.listaDezenas || []).map((n) => Number(n)).sort((a, b) => a - b);
    if (numbers.length === 0 || !data.dataApuracao) {
      throw new Error('Resposta da Caixa sem dezenas ou data');
    }

    const [day, month, year] = data.dataApuracao.split('/');
    response.status(200).json({
      reference: data.numero ? `Concurso ${data.numero}` : `Sorteio de ${data.dataApuracao}`,
      draw_date: `${year}-${month}-${day}`,
      numbers,
      source: 'caixa-live',
    });
  } catch (error) {
    response.status(502).json({ error: String(error && error.message ? error.message : error) });
  }
}
