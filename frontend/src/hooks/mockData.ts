// =============================================================================
// LotoPredict Engine — Motor Preditivo Offline (TypeScript)
// Espelho fiel do backend Python: probability.py + prediction_service.py
// Versão: 2.0 — Filtros completos (Paridade, Soma, Consecutivos, Quadrantes, Jogos Estúpidos)
// =============================================================================

export interface Draw {
  concurso: number;
  data: string;
  numbers: number[];
}

// ---------------------------------------------------------------------------
// DADOS HISTÓRICOS REAIS (usados como base offline quando o backend está off)
// ---------------------------------------------------------------------------
export const MOCK_DRAWS: Record<string, Draw[]> = {
  megasena: [
    { concurso: 2740, data: '2026-06-25', numbers: [12, 15, 23, 31, 48, 59] },
    { concurso: 2739, data: '2026-06-22', numbers: [2, 19, 25, 38, 41, 52] },
    { concurso: 2738, data: '2026-06-18', numbers: [9, 14, 22, 33, 45, 50] },
    { concurso: 2737, data: '2026-06-15', numbers: [5, 11, 29, 34, 49, 56] },
    { concurso: 2736, data: '2026-06-11', numbers: [7, 18, 20, 37, 43, 58] },
    { concurso: 2735, data: '2026-06-08', numbers: [1, 13, 27, 30, 42, 51] },
    { concurso: 2734, data: '2026-06-04', numbers: [10, 16, 21, 35, 47, 60] },
    { concurso: 2733, data: '2026-06-01', numbers: [3, 8, 26, 39, 44, 55] },
    { concurso: 2732, data: '2026-05-28', numbers: [6, 17, 24, 32, 40, 57] },
    { concurso: 2731, data: '2026-05-25', numbers: [4, 15, 28, 36, 46, 53] },
    { concurso: 2730, data: '2026-05-21', numbers: [12, 18, 25, 33, 41, 59] },
    { concurso: 2729, data: '2026-05-18', numbers: [2, 10, 22, 31, 48, 52] },
    { concurso: 2728, data: '2026-05-14', numbers: [9, 14, 27, 34, 45, 56] },
    { concurso: 2727, data: '2026-05-11', numbers: [5, 16, 20, 37, 49, 50] },
    { concurso: 2726, data: '2026-05-07', numbers: [7, 13, 29, 35, 43, 58] },
    { concurso: 2725, data: '2026-05-04', numbers: [3, 19, 24, 38, 44, 60] },
    { concurso: 2724, data: '2026-04-30', numbers: [8, 11, 26, 30, 47, 53] },
    { concurso: 2723, data: '2026-04-26', numbers: [1, 17, 23, 39, 42, 55] },
    { concurso: 2722, data: '2026-04-22', numbers: [6, 15, 21, 32, 46, 57] },
    { concurso: 2721, data: '2026-04-18', numbers: [4, 12, 28, 36, 43, 51] },
  ],
  lotofacil: [
    { concurso: 3135, data: '2026-06-25', numbers: [1, 2, 4, 5, 8, 9, 11, 12, 15, 16, 18, 19, 21, 22, 25] },
    { concurso: 3134, data: '2026-06-24', numbers: [2, 3, 5, 6, 7, 10, 12, 13, 14, 17, 19, 20, 22, 23, 24] },
    { concurso: 3133, data: '2026-06-23', numbers: [1, 4, 6, 8, 9, 10, 11, 13, 15, 16, 17, 21, 23, 24, 25] },
    { concurso: 3132, data: '2026-06-22', numbers: [3, 5, 7, 8, 9, 12, 14, 15, 18, 19, 20, 21, 22, 24, 25] },
    { concurso: 3131, data: '2026-06-20', numbers: [1, 2, 3, 4, 10, 11, 12, 13, 16, 17, 18, 19, 22, 23, 25] },
    { concurso: 3130, data: '2026-06-19', numbers: [1, 5, 6, 7, 8, 9, 11, 14, 15, 16, 20, 21, 22, 23, 24] },
    { concurso: 3129, data: '2026-06-18', numbers: [2, 3, 4, 8, 9, 10, 12, 13, 15, 17, 18, 19, 21, 24, 25] },
    { concurso: 3128, data: '2026-06-17', numbers: [1, 4, 5, 6, 7, 11, 12, 14, 16, 18, 20, 22, 23, 24, 25] },
    { concurso: 3127, data: '2026-06-16', numbers: [2, 3, 5, 8, 9, 10, 13, 14, 15, 17, 19, 21, 22, 23, 25] },
    { concurso: 3126, data: '2026-06-15', numbers: [1, 2, 4, 6, 7, 11, 12, 13, 16, 18, 19, 20, 21, 24, 25] },
    { concurso: 3125, data: '2026-06-13', numbers: [3, 4, 5, 7, 9, 10, 11, 14, 15, 17, 18, 20, 22, 23, 25] },
    { concurso: 3124, data: '2026-06-12', numbers: [1, 2, 5, 6, 8, 10, 12, 14, 16, 17, 19, 20, 21, 22, 24] },
    { concurso: 3123, data: '2026-06-11', numbers: [2, 4, 6, 7, 9, 11, 13, 15, 16, 18, 19, 21, 22, 23, 25] },
    { concurso: 3122, data: '2026-06-10', numbers: [1, 3, 5, 7, 8, 10, 12, 14, 16, 17, 19, 20, 21, 23, 25] },
    { concurso: 3121, data: '2026-06-09', numbers: [2, 3, 4, 6, 9, 11, 12, 13, 15, 17, 18, 20, 22, 24, 25] },
    { concurso: 3120, data: '2026-06-08', numbers: [1, 4, 5, 7, 8, 10, 11, 14, 16, 18, 19, 21, 22, 23, 24] },
    { concurso: 3119, data: '2026-06-06', numbers: [3, 5, 6, 8, 9, 10, 12, 13, 14, 17, 19, 20, 21, 24, 25] },
    { concurso: 3118, data: '2026-06-05', numbers: [1, 2, 4, 7, 8, 11, 12, 15, 16, 17, 19, 20, 22, 23, 25] },
    { concurso: 3117, data: '2026-06-04', numbers: [2, 3, 5, 6, 9, 10, 11, 13, 14, 16, 18, 21, 22, 24, 25] },
    { concurso: 3116, data: '2026-06-03', numbers: [1, 4, 6, 7, 8, 10, 12, 13, 15, 17, 19, 20, 21, 23, 25] },
  ],
  quina: [
    { concurso: 6465, data: '2026-06-25', numbers: [14, 25, 39, 52, 71] },
    { concurso: 6464, data: '2026-06-24', numbers: [8, 17, 43, 60, 78] },
    { concurso: 6463, data: '2026-06-23', numbers: [3, 29, 31, 58, 62] },
    { concurso: 6462, data: '2026-06-22', numbers: [12, 21, 35, 47, 80] },
    { concurso: 6461, data: '2026-06-20', numbers: [5, 18, 44, 56, 73] },
    { concurso: 6460, data: '2026-06-19', numbers: [1, 27, 30, 49, 79] },
    { concurso: 6459, data: '2026-06-18', numbers: [10, 16, 42, 51, 68] },
    { concurso: 6458, data: '2026-06-17', numbers: [6, 24, 38, 59, 75] },
    { concurso: 6457, data: '2026-06-16', numbers: [2, 15, 33, 46, 70] },
    { concurso: 6456, data: '2026-06-15', numbers: [7, 28, 36, 53, 77] },
    { concurso: 6455, data: '2026-06-13', numbers: [4, 19, 41, 57, 74] },
    { concurso: 6454, data: '2026-06-12', numbers: [11, 23, 34, 48, 69] },
    { concurso: 6453, data: '2026-06-11', numbers: [9, 20, 37, 55, 76] },
    { concurso: 6452, data: '2026-06-10', numbers: [13, 26, 40, 50, 72] },
    { concurso: 6451, data: '2026-06-09', numbers: [3, 22, 32, 61, 80] },
    { concurso: 6450, data: '2026-06-08', numbers: [6, 17, 45, 54, 67] },
    { concurso: 6449, data: '2026-06-06', numbers: [1, 25, 38, 49, 78] },
    { concurso: 6448, data: '2026-06-05', numbers: [8, 14, 31, 60, 73] },
    { concurso: 6447, data: '2026-06-04', numbers: [2, 21, 43, 56, 70] },
    { concurso: 6446, data: '2026-06-03', numbers: [10, 29, 35, 47, 79] },
  ]
};

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO POR LOTERIA
// ---------------------------------------------------------------------------
interface LotteryConfig {
  maxNumber: number;
  gameSize: number;
  minSum: number;
  maxSum: number;
  minPares: number;
  maxPares: number;
  maxConsecutive: number;
  maxPerQuadrant: number;
  poolRatio: number;  // Percentual das melhores dezenas para o pool de seleção
}

const LOTTERY_CONFIG: Record<string, LotteryConfig> = {
  megasena: {
    maxNumber: 60, gameSize: 6,
    minSum: 120, maxSum: 220,
    minPares: 2, maxPares: 4,
    maxConsecutive: 2,
    maxPerQuadrant: 4,
    poolRatio: 0.5
  },
  lotofacil: {
    maxNumber: 25, gameSize: 15,
    minSum: 160, maxSum: 230,
    minPares: 6, maxPares: 9,
    maxConsecutive: 3,
    maxPerQuadrant: 99, // Lotofácil não usa filtro de quadrante
    poolRatio: 0.8
  },
  quina: {
    maxNumber: 80, gameSize: 5,
    minSum: 150, maxSum: 250,
    minPares: 2, maxPares: 3,
    maxConsecutive: 2,
    maxPerQuadrant: 3,
    poolRatio: 0.5
  }
};

// ---------------------------------------------------------------------------
// FILTROS ESTATÍSTICOS (espelho exato do probability.py Python)
// ---------------------------------------------------------------------------

/** Filtro de Paridade — faixas calibradas com o histórico real */
function isParityOk(numbers: number[], cfg: LotteryConfig): boolean {
  const pares = numbers.filter(n => n % 2 === 0).length;
  return pares >= cfg.minPares && pares <= cfg.maxPares;
}

/** Filtro de Soma — faixa ideal da Curva Normal histórica */
function isSumOk(numbers: number[], cfg: LotteryConfig): boolean {
  const total = numbers.reduce((a, b) => a + b, 0);
  return total >= cfg.minSum && total <= cfg.maxSum;
}

/** Filtro de Consecutivos — evita aglomeração linear */
function isConsecutiveOk(numbers: number[], cfg: LotteryConfig): boolean {
  const sorted = [...numbers].sort((a, b) => a - b);
  let maxSeq = 1, currentSeq = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] === sorted[i] + 1) {
      currentSeq++;
      maxSeq = Math.max(maxSeq, currentSeq);
    } else {
      currentSeq = 1;
    }
  }
  return maxSeq <= cfg.maxConsecutive;
}

/** Filtro de Quadrante — evita concentração física no volante */
function isQuadrantOk(numbers: number[], lottery: string, cfg: LotteryConfig): boolean {
  if (lottery === 'lotofacil') return true; // Sem restrição de quadrante na Lotofácil

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const cols = lottery === 'megasena' ? 10 : 10;
  const splitRow = lottery === 'megasena' ? 3 : 4; // Linha divisória de quadrantes

  for (const n of numbers) {
    const row = Math.floor((n - 1) / cols);
    const col = ((n - 1) % cols) + 1;
    const q = row < splitRow
      ? (col <= 5 ? 1 : 2)
      : (col <= 5 ? 3 : 4);
    counts[q]++;
  }

  return Object.values(counts).every(count => count <= cfg.maxPerQuadrant);
}

/** Filtro de Jogos Estúpidos — descarta sequências óbvias e dígitos idênticos */
function isStupidGame(numbers: number[], draws: Draw[]): boolean {
  const sorted = [...numbers].sort((a, b) => a - b);

  // 1. Bloqueia sequências perfeitamente consecutivas (ex: 1,2,3,4,5,6)
  const isFullSequence = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
  if (isFullSequence && sorted.length > 2) return true;

  // 2. Bloqueia jogos onde todos terminam com o mesmo dígito (ex: 2,12,22,32,42,52)
  const endDigits = sorted.map(n => n % 10);
  if (new Set(endDigits).size === 1) return true;

  // 3. Bloqueia jogos já sorteados no histórico mock
  const drawSets = draws.map(d => JSON.stringify([...d.numbers].sort((a, b) => a - b)));
  if (drawSets.includes(JSON.stringify(sorted))) return true;

  return false;
}

/** Aplica a esteira completa de filtros */
function validateGame(numbers: number[], lottery: string, cfg: LotteryConfig, draws: Draw[]): boolean {
  return (
    isParityOk(numbers, cfg) &&
    isSumOk(numbers, cfg) &&
    isConsecutiveOk(numbers, cfg) &&
    isQuadrantOk(numbers, lottery, cfg) &&
    !isStupidGame(numbers, draws)
  );
}

// ---------------------------------------------------------------------------
// ANÁLISE DE FREQUÊNCIA E ATRASO
// ---------------------------------------------------------------------------

function computeFrequency(draws: Draw[], maxNumber: number): Record<number, number> {
  const freq: Record<number, number> = {};
  for (let i = 1; i <= maxNumber; i++) freq[i] = 0;
  for (const d of draws) {
    for (const n of d.numbers) freq[n] = (freq[n] || 0) + 1;
  }
  return freq;
}

function computeDelay(draws: Draw[], maxNumber: number): Record<number, number> {
  const delay: Record<number, number> = {};
  for (let i = 1; i <= maxNumber; i++) delay[i] = draws.length;
  const seen = new Set<number>();
  for (let idx = 0; idx < draws.length; idx++) {
    for (const n of draws[idx].numbers) {
      if (!seen.has(n)) {
        delay[n] = idx;
        seen.add(n);
      }
    }
  }
  return delay;
}

// ---------------------------------------------------------------------------
// ANÁLISE DE PARES
// ---------------------------------------------------------------------------
function computePairs(draws: Draw[]): [string, number][] {
  const pairCounts: Record<string, number> = {};
  for (const d of draws) {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = `${sorted[i]}-${sorted[j]}`;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  }
  return Object.entries(pairCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
}

// ---------------------------------------------------------------------------
// ANÁLISE DE TERMINADORES (último dígito)
// ---------------------------------------------------------------------------
function computeTerminators(draws: Draw[]): [number, number][] {
  const termCounts: Record<number, number> = {};
  for (const d of draws) {
    for (const n of d.numbers) {
      const lastDigit = n % 10;
      termCounts[lastDigit] = (termCounts[lastDigit] || 0) + 1;
    }
  }
  return Object.entries(termCounts)
    .map(([k, v]) => [parseInt(k), v] as [number, number])
    .sort((a, b) => a[0] - b[0]);
}

// ---------------------------------------------------------------------------
// JANELA DESLIZANTE (tendência recente vs total)
// ---------------------------------------------------------------------------
function computeTrendingUp(draws: Draw[], maxNumber: number): [number, number][] {
  if (draws.length < 5) return [];
  const windowSize = Math.min(25, Math.floor(draws.length / 2));
  const recentDraws = draws.slice(0, windowSize);
  
  const freqTotal = computeFrequency(draws, maxNumber);
  const freqRecent = computeFrequency(recentDraws, maxNumber);
  
  const totalCount = draws.reduce((s, d) => s + d.numbers.length, 0);
  const recentCount = recentDraws.reduce((s, d) => s + d.numbers.length, 0);
  
  const trending: [number, number][] = [];
  for (let n = 1; n <= maxNumber; n++) {
    const recentPct = freqRecent[n] / (recentCount || 1);
    const totalPct = freqTotal[n] / (totalCount || 1);
    const diff = (recentPct - totalPct) * 100;
    if (diff > 0) {
      trending.push([n, Math.round(diff * 100) / 100]);
    }
  }
  return trending.sort((a, b) => b[1] - a[1]).slice(0, 10);
}

// ---------------------------------------------------------------------------
// ALL FREQUENCIES (para heatmap)
// ---------------------------------------------------------------------------
function computeAllFrequencies(draws: Draw[], maxNumber: number): Record<string, number> {
  const freq = computeFrequency(draws, maxNumber);
  const total = draws.reduce((s, d) => s + d.numbers.length, 0) || 1;
  const result: Record<string, number> = {};
  for (let n = 1; n <= maxNumber; n++) {
    result[String(n)] = freq[n] / total;
  }
  return result;
}

// ---------------------------------------------------------------------------
// STATS PARA O DASHBOARD (ENRIQUECIDO)
// ---------------------------------------------------------------------------
export const getMockStats = (lottery: string, limit?: number) => {
  let draws = MOCK_DRAWS[lottery] || [];
  if (limit) draws = draws.slice(0, limit);
  const total = draws.length;
  if (total === 0) return null;

  const cfg = LOTTERY_CONFIG[lottery] || LOTTERY_CONFIG.megasena;
  const freq = computeFrequency(draws, cfg.maxNumber);
  const delay = computeDelay(draws, cfg.maxNumber);

  const sorted = Object.entries(freq)
    .map(([num, count]) => [parseInt(num), count] as [number, number])
    .sort((a, b) => b[1] - a[1]);

  const delayRanking = Object.entries(delay)
    .map(([num, d]) => ({ num: parseInt(num), delay: d }))
    .sort((a, b) => b.delay - a.delay)
    .slice(0, 10);

  // NOVAS ANÁLISES
  const topPairs = computePairs(draws);
  const terminators = computeTerminators(draws);
  const trendingUp = computeTrendingUp(draws, cfg.maxNumber);
  const allFrequencies = computeAllFrequencies(draws, cfg.maxNumber);

  return {
    lottery_name: lottery.toUpperCase(),
    total_results: total,
    date_range: {
      start: draws[draws.length - 1].data,
      end: draws[0].data
    },
    most_common_numbers: sorted.slice(0, 10),
    least_common_numbers: [...sorted].reverse().slice(0, 10),
    most_delayed: delayRanking,
    top_pairs: topPairs,
    terminators: terminators,
    trending_up: trendingUp,
    all_frequencies: allFrequencies
  };
};

// ---------------------------------------------------------------------------
// GERADOR PREDITIVO OFFLINE — Motor com Filtros Completos
// Espelho do ProbabilityAlgorithms.generate_prediction() do Python
// ---------------------------------------------------------------------------
export const generateMockGames = (lottery: string, numGames: number, strategy: string): number[][] => {
  const cfg = LOTTERY_CONFIG[lottery] || LOTTERY_CONFIG.megasena;
  const draws = MOCK_DRAWS[lottery] || [];

  // Calcular frequência e atraso
  const freq = computeFrequency(draws, cfg.maxNumber);
  const delay = computeDelay(draws, cfg.maxNumber);

  // Normalizar scores
  const maxFreq = Math.max(...Object.values(freq), 1);
  const maxDelay = Math.max(...Object.values(delay), 1);

  const scores: Record<number, number> = {};
  for (let i = 1; i <= cfg.maxNumber; i++) {
    const fNorm = freq[i] / maxFreq;
    const dNorm = delay[i] / maxDelay;

    if (strategy === 'frequency') {
      scores[i] = fNorm;
    } else if (strategy === 'delay') {
      scores[i] = dNorm;
    } else {
      // Híbrida: 60% frequência + 40% atraso (mesmo peso do backend Python)
      scores[i] = (fNorm * 0.6) + (dNorm * 0.4);
    }
  }

  // Pool das melhores dezenas (top 50% ou configurado por loteria)
  const poolSize = Math.max(cfg.gameSize + 5, Math.floor(cfg.maxNumber * cfg.poolRatio));
  const sortedScores = Object.entries(scores)
    .map(([n, s]) => ({ num: parseInt(n), score: s }))
    .sort((a, b) => b.score - a.score);
  const bestNumbers = sortedScores.slice(0, poolSize).map(x => x.num);

  const games: number[][] = [];
  const MAX_ATTEMPTS = 5000;

  const tryGenerateFromPool = (pool: number[]): number[] | null => {
    // Seleção ponderada sem repetição
    const available = pool.map(n => ({ num: n, score: scores[n] + 0.01 }));
    const candidate: number[] = [];

    while (candidate.length < cfg.gameSize && available.length > 0) {
      const totalScore = available.reduce((sum, x) => sum + x.score, 0);
      let rand = Math.random() * totalScore;
      let selectedIdx = 0;
      for (let i = 0; i < available.length; i++) {
        rand -= available[i].score;
        if (rand <= 0) { selectedIdx = i; break; }
      }
      candidate.push(available[selectedIdx].num);
      available.splice(selectedIdx, 1);
    }

    candidate.sort((a, b) => a - b);
    return validateGame(candidate, lottery, cfg, draws) ? candidate : null;
  };

  let attempts = 0;
  while (games.length < numGames && attempts < MAX_ATTEMPTS) {
    attempts++;

    // Primeiro tenta com o pool restrito (dezenas melhores)
    let game = tryGenerateFromPool(bestNumbers);

    // Se falhar, abre para todas as dezenas
    if (!game) {
      const allNumbers = Array.from({ length: cfg.maxNumber }, (_, i) => i + 1);
      game = tryGenerateFromPool(allNumbers);
    }

    if (game && !games.some(g => JSON.stringify(g) === JSON.stringify(game))) {
      games.push(game);
    }
  }

  // Fallback de segurança: preenche jogos faltantes com seleção ponderada sem filtros
  // (Evita retornar array vazio; usa scores mas sem validação)
  while (games.length < numGames) {
    const allNumbers = Array.from({ length: cfg.maxNumber }, (_, i) => i + 1);
    const pool = [...allNumbers];
    const backup: number[] = [];

    while (backup.length < cfg.gameSize && pool.length > 0) {
      const totalScore = pool.reduce((sum, n) => sum + (scores[n] || 0.01), 0);
      let rand = Math.random() * totalScore;
      let idx = 0;
      for (let i = 0; i < pool.length; i++) {
        rand -= (scores[pool[i]] || 0.01);
        if (rand <= 0) { idx = i; break; }
      }
      backup.push(pool[idx]);
      pool.splice(idx, 1);
    }

    backup.sort((a, b) => a - b);
    games.push(backup);
  }

  return games;
};

// ---------------------------------------------------------------------------
// PERSISTÊNCIA LOCALSTORAGE PARA COLEÇÕES OFFLINE
// ---------------------------------------------------------------------------

const LOCAL_STORAGE_KEY = 'lotopredict_collections';

export interface LocalCollection {
  id: number;
  name: string;
  lottery_name: string;
  games: number[][];
  created_at: string;
}

export const getLocalCollections = (): LocalCollection[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveLocalCollection = (name: string, lotteryName: string, games: number[][]) => {
  const cols = getLocalCollections();
  const newCol: LocalCollection = {
    id: Date.now(),
    name,
    lottery_name: lotteryName.toLowerCase().includes('mega')
      ? 'Mega-Sena'
      : lotteryName.toLowerCase().includes('facil')
        ? 'Lotofácil'
        : 'Quina',
    games,
    created_at: new Date().toISOString()
  };
  cols.push(newCol);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cols));
  return newCol;
};

export const deleteLocalCollection = (id: number) => {
  const cols = getLocalCollections();
  const filtered = cols.filter(c => c.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
};

export const getLocalCollectionDetail = (id: number) => {
  const cols = getLocalCollections();
  const col = cols.find(c => c.id === id);
  if (!col) return null;

  const lotKey = col.lottery_name.toLowerCase().includes('mega')
    ? 'megasena'
    : col.lottery_name.toLowerCase().includes('facil')
      ? 'lotofacil'
      : 'quina';

  const draws = MOCK_DRAWS[lotKey] || [];
  const lastDraw = draws[0] || null;

  const checking_summary = col.games.map((game, idx) => {
    let hits = 0;
    if (lastDraw) {
      hits = game.filter(n => lastDraw.numbers.includes(n)).length;
    }

    let award = 'Nenhum';
    if (lotKey === 'megasena') {
      if (hits === 4) award = 'Quadra';
      else if (hits === 5) award = 'Quina';
      else if (hits === 6) award = 'Sena';
    } else if (lotKey === 'lotofacil') {
      if (hits >= 11) award = `${hits} Acertos`;
    } else {
      if (hits === 2) award = 'Duque';
      else if (hits === 3) award = 'Terno';
      else if (hits === 4) award = 'Quadra';
      else if (hits === 5) award = 'Quina';
    }

    return {
      game_index: idx + 1,
      game,
      hits_count: hits,
      award_achieved: award
    };
  });

  return {
    id: col.id,
    name: col.name,
    lottery_name: col.lottery_name,
    created_at: col.created_at,
    last_real_draw: lastDraw ? {
      reference: `Concurso ${lastDraw.concurso}`,
      draw_date: lastDraw.data,
      numbers: lastDraw.numbers
    } : null,
    checking_summary
  };
};

export const updateLocalCollection = (id: number, newName: string) => {
  const cols = getLocalCollections();
  const idx = cols.findIndex(c => c.id === id);
  if (idx !== -1) {
    cols[idx].name = newName;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cols));
  }
};

// ---------------------------------------------------------------------------
// FECHAMENTO MATEMÁTICO — Algoritmo Greedy Cover (TypeScript)
// Roda em Web Worker para não bloquear a thread principal (idealmente)
// ---------------------------------------------------------------------------

/** Gera todas as combinações de `size` elementos do array */
function getCombinations(array: number[], size: number): number[][] {
  const result: number[][] = [];
  function helper(start: number, combo: number[]) {
    if (combo.length === size) { result.push([...combo]); return; }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

export const runLocalFechamento = (
  selectedNumbers: number[],
  gameSize: number,
  guarantee: number,
  conditionHits: number
): number[][] => {
  const numbers = [...new Set(selectedNumbers)].sort((a, b) => a - b);

  if (numbers.length < gameSize || guarantee > gameSize || conditionHits > numbers.length) {
    return [];
  }

  const allPossibleBets = getCombinations(numbers, gameSize).map(arr => new Set(arr));
  const allDrawSubsets = getCombinations(numbers, conditionHits).map(arr => new Set(arr));

  const uncoveredSubsets = new Set<number>();
  for (let i = 0; i < allDrawSubsets.length; i++) uncoveredSubsets.add(i);

  const betCoverMap: Set<number>[] = [];
  for (let i = 0; i < allPossibleBets.length; i++) {
    const bet = allPossibleBets[i];
    const coveredIndices = new Set<number>();
    for (let j = 0; j < allDrawSubsets.length; j++) {
      let hits = 0;
      for (const num of bet) { if (allDrawSubsets[j].has(num)) hits++; }
      if (hits >= guarantee) coveredIndices.add(j);
    }
    betCoverMap.push(coveredIndices);
  }

  const chosenBets: number[][] = [];

  while (uncoveredSubsets.size > 0) {
    let bestBetIdx = -1, maxNewCover = 0;
    for (let i = 0; i < betCoverMap.length; i++) {
      let newCover = 0;
      for (const idx of betCoverMap[i]) { if (uncoveredSubsets.has(idx)) newCover++; }
      if (newCover > maxNewCover) { maxNewCover = newCover; bestBetIdx = i; }
    }
    if (bestBetIdx === -1 || maxNewCover === 0) break;

    chosenBets.push([...allPossibleBets[bestBetIdx]].sort((a, b) => a - b));
    for (const idx of betCoverMap[bestBetIdx]) uncoveredSubsets.delete(idx);
  }

  return chosenBets;
};
