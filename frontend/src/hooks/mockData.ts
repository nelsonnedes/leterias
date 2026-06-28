// Dados históricos reais simulados para Fallback Offline
export interface Draw {
  concurso: number;
  data: string;
  numbers: number[];
}

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
  ]
};

// --- LÓGICA DE ALGORITMO PREDITIVO OFFLINE ---

// Retorna as estatísticas de dezenas quentes e frias baseadas no mock
export const getMockStats = (lottery: string) => {
  const draws = MOCK_DRAWS[lottery] || [];
  const total = draws.length;
  if (total === 0) return null;

  const frequencyMap: Record<number, number> = {};
  
  // Padrão de range
  const maxNumber = lottery === 'megasena' ? 60 : lottery === 'lotofacil' ? 25 : 80;
  for (let i = 1; i <= maxNumber; i++) {
    frequencyMap[i] = 0;
  }

  draws.forEach((d) => {
    d.numbers.forEach((num) => {
      frequencyMap[num] = (frequencyMap[num] || 0) + 1;
    });
  });

  const sorted = Object.entries(frequencyMap)
    .map(([num, count]) => [parseInt(num), count] as [number, number])
    .sort((a, b) => b[1] - a[1]);

  return {
    lottery_name: lottery.toUpperCase(),
    total_results: total,
    date_range: {
      start: draws[draws.length - 1].data,
      end: draws[0].data
    },
    most_common_numbers: sorted.slice(0, 10),
    least_common_numbers: [...sorted].reverse().slice(0, 10)
  };
};

// Implementação simples do algoritmo preditivo com filtros no frontend
export const generateMockGames = (lottery: string, numGames: number, strategy: string): number[][] => {
  const maxNumber = lottery === 'megasena' ? 60 : lottery === 'lotofacil' ? 25 : 80;
  const gameSize = lottery === 'megasena' ? 6 : lottery === 'lotofacil' ? 15 : 5;
  const draws = MOCK_DRAWS[lottery] || [];

  // Calcular frequência e atraso
  const freq: Record<number, number> = {};
  const lastSeen: Record<number, number> = {};

  for (let i = 1; i <= maxNumber; i++) {
    freq[i] = 0;
    lastSeen[i] = draws.length; // Máximo atraso inicial
  }

  draws.forEach((d, idx) => {
    d.numbers.forEach((num) => {
      freq[num]++;
      if (lastSeen[num] === draws.length) {
        lastSeen[num] = idx; // Indice de atraso (0 = mais recente)
      }
    });
  });

  const games: number[][] = [];
  let attempts = 0;

  // Parâmetros de Filtros
  const minSum = lottery === 'megasena' ? 100 : lottery === 'lotofacil' ? 150 : 80;
  const maxSum = lottery === 'megasena' ? 260 : lottery === 'lotofacil' ? 240 : 320;
  
  while (games.length < numGames && attempts < 1000) {
    attempts++;
    const candidate: number[] = [];
    
    // Seleção de dezenas ponderada
    const pool: { num: number; score: number }[] = [];
    for (let i = 1; i <= maxNumber; i++) {
      let score = 1.0;
      if (strategy === 'frequency') {
        score = freq[i] + 1;
      } else if (strategy === 'delay') {
        score = lastSeen[i] + 1;
      } else {
        // Híbrida: 60% Frequência + 40% Atraso
        score = (freq[i] * 0.6) + (lastSeen[i] * 0.4) + 1;
      }
      pool.push({ num: i, score });
    }

    // Sortear sem repetição baseado nos scores
    while (candidate.length < gameSize) {
      const totalScore = pool.reduce((sum, item) => sum + item.score, 0);
      let rand = Math.random() * totalScore;
      
      let selectedIdx = 0;
      for (let i = 0; i < pool.length; i++) {
        rand -= pool[i].score;
        if (rand <= 0) {
          selectedIdx = i;
          break;
        }
      }
      
      const selected = pool[selectedIdx].num;
      candidate.push(selected);
      pool.splice(selectedIdx, 1); // Remove para não repetir
    }

    candidate.sort((a, b) => a - b);

    // --- FILTROS ---
    
    // 1. Filtro de Soma
    const sum = candidate.reduce((a, b) => a + b, 0);
    if (sum < minSum || sum > maxSum) continue;

    // 2. Filtro de Paridade (Mega-Sena e Quina não devem ter dezenas 100% pares ou 100% ímpares)
    const evens = candidate.filter((n) => n % 2 === 0).length;
    const odds = candidate.length - evens;
    if (lottery === 'megasena' && (evens === 0 || odds === 0)) continue;
    if (lottery === 'lotofacil' && (evens < 4 || evens > 10)) continue;

    // 3. Filtro de Consecutivos (Mega-Sena / Quina: não mais de 2 consecutivos)
    let consecutiveCount = 0;
    for (let i = 0; i < candidate.length - 1; i++) {
      if (candidate[i + 1] - candidate[i] === 1) consecutiveCount++;
    }
    if (lottery !== 'lotofacil' && consecutiveCount > 1) continue;

    // Evita duplicidade nas coleções geradas
    if (!games.some(g => JSON.stringify(g) === JSON.stringify(candidate))) {
      games.push(candidate);
    }
  }

  // Fallback se os filtros forem muito rígidos e falharem
  while (games.length < numGames) {
    const backup: number[] = [];
    while (backup.length < gameSize) {
      const val = Math.floor(Math.random() * maxNumber) + 1;
      if (!backup.includes(val)) backup.push(val);
    }
    backup.sort((a, b) => a - b);
    games.push(backup);
  }

  return games;
};

// --- PERSISTÊNCIA LOCALSTORAGE PARA COLEÇÕES OFFLINE ---

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
    lottery_name: lotteryName.toLowerCase().includes('mega') ? 'Mega-Sena' : lotteryName.toLowerCase().includes('facil') ? 'Lotofácil' : 'Quina',
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
