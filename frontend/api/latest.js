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

  try {
    const upstream = await fetch(
      `https://servicebus2.caixa.gov.br/portaldeloterias/api/${endpoint}`,
      { headers: { 'User-Agent': 'LotoPredict/2.0' } },
    );
    if (!upstream.ok) {
      throw new Error(`Caixa respondeu HTTP ${upstream.status}`);
    }
    const data = await upstream.json();
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
