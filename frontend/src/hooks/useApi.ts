import axios from 'axios';
import {
  getMockStats,
  generateMockGames,
  getLocalCollections,
  saveLocalCollection,
  deleteLocalCollection,
  getLocalCollectionDetail,
  updateLocalCollection,
  runLocalFechamento,
  MOCK_DRAWS
} from './mockData';

const getBaseURL = () => {
  // 1. Variável de ambiente explícita (maior prioridade — configura no .env ou no Vercel Dashboard)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. URL do backend hospedado no Render (configura VITE_RENDER_API_URL no Vercel Dashboard)
  if (import.meta.env.VITE_RENDER_API_URL) {
    return import.meta.env.VITE_RENDER_API_URL;
  }

  // 3. Detecção de ambiente
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Desenvolvimento local
      return 'http://localhost:8000/api/v1';
    }
    // Produção (Vercel) sem variável de ambiente — modo offline
    return '';
  }
  return '';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 4000, // 4s: permite cold start do Render free tier (~2-3s) antes de cair para offline
  headers: {
    'Content-Type': 'application/json',
  }
});

export interface LotteryStats {
  lottery_name: string;
  total_results: number;
  date_range: {
    start: string;
    end: string;
  };
  most_common_numbers: [number, number][];
  least_common_numbers: [number, number][];
  top_pairs?: [string, number][];
  terminators?: [number, number][];
  trending_up?: [number, number][];
  all_frequencies?: Record<string, number>;
}

export interface OddsInfo {
  lottery: string;
  lottery_key: string;
  universe_size: number;
  draw_size: number;
  total_combinations: number;
  all_hits: {
    probability_per_game: number;
    denominator_per_game: number;
    probability_with_games: number;
    denominator_with_games: number;
    games: number;
    formula: string;
  };
  notice: string;
  data_source?: 'api' | 'demo';
}

export interface PredictionResponse {
  lottery: string;
  strategy_used: string;
  mode?: 'uniform' | 'illustrative';
  seed?: number | null;
  total_historical_draws_analyzed: number;
  games: number[][];
  distinct_games?: number;
  odds?: OddsInfo['all_hits'];
  notice?: string;
  data_source?: 'api' | 'demo';
}

export interface BacktestResponse {
  lottery: string;
  strategy_tested: string;
  mode?: 'uniform' | 'illustrative';
  seed?: number | null;
  concursos_simulados: number;
  total_apostas_simuladas: number;
  hits_distribution: Record<string, number>;
  expected_distribution?: Record<string, number>;
  rewards_summary: Record<string, number>;
  hits_by_draw?: {
    concurso: number;
    reference: string;
    max_hits: number;
  }[];
  top_games?: {
    game: number[];
    hits: number;
    concurso: number;
    hit_numbers?: number[];
  }[];
  from_start?: boolean;
  notice?: string;
  simulations_detail: {
    reference: string;
    real_numbers: number[];
    max_hits_achieved: number;
    games_simulated: {
      game: number[];
      hits: number;
    }[];
  }[];
}

export interface FechamentoParams {
  lottery_name: string;
  selected_numbers: number[];
  guarantee: number;
  condition_hits: number;
}

export interface FechamentoResult {
  lottery: string;
  selected_numbers: number[];
  game_size: number;
  guarantee: number;
  condition_hits: number;
  total_games_generated: number;
  games: number[][];
}

export interface GameCollection {
  id: number;
  name: string;
  lottery_name: string;
  total_games: number;
  created_at: string;
}

export interface CollectionDetail {
  id: number;
  name: string;
  lottery_name: string;
  created_at: string;
  last_real_draw: {
    reference: string;
    draw_date: string;
    numbers: number[];
    source?: 'caixa-live' | 'database';
    stale?: boolean;
  } | null;
  checking_summary: {
    game_index: number;
    game: number[];
    hits_count: number;
    award_achieved: string;
  }[];
  data_source?: 'api' | 'demo';
  notice?: string;
}

export interface CoverageCurveResponse {
  lottery: string;
  curve: { num_bets: number; coverage_pct: number }[];
  required_bets: number;
  final_coverage_pct: number;
}

export interface CoverageResult {
  covered_subsets: number;
  total_subsets: number;
  coverage_pct: number;
}

const canonicalLotteryKey = (name: string): string => {
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  if (normalized.includes('mega')) return 'megasena';
  if (normalized.includes('facil')) return 'lotofacil';
  if (normalized.includes('quina')) return 'quina';
  return normalized;
};

const awardForHits = (lotteryKey: string, hits: number): string => {
  if (lotteryKey === 'megasena') {
    if (hits === 6) return 'Sena';
    if (hits === 5) return 'Quina';
    if (hits === 4) return 'Quadra';
  } else if (lotteryKey === 'lotofacil') {
    if (hits >= 11) return `${hits} Acertos`;
  } else if (lotteryKey === 'quina') {
    if (hits === 5) return 'Quina';
    if (hits === 4) return 'Quadra';
    if (hits === 3) return 'Terno';
    if (hits === 2) return 'Duque';
  }
  return 'Nenhum';
};

// Helper para verificar se o erro foi de conexão recusada ou offline
// Trata 404 como 'backend indisponível' para ativar fallback offline (ex: Vercel sem backend)
const isNetworkError = (error: any): boolean => {
  // Se não houve resposta HTTP (conexão recusada, timeout, etc)
  if (!error.response) {
    return !error.status || error.code === 'ERR_NETWORK' || error.message.includes('timeout');
  }
  // Se houve resposta 404, o backend não está disponível neste domínio (ex: Vercel sem backend)
  if (error.response.status === 404) {
    return true;
  }
  // Backend online, mas sem histórico carregado: mesma condição de indisponibilidade
  if (error.response.status === 400) {
    const detail = String(error.response.data?.detail || '');
    if (detail.includes('Histórico insuficiente')) return true;
  }
  return false;
};

export const useApi = () => {
  
  // Obter estatísticas básicas
  const getStats = async (lotteryName: string, limit?: number): Promise<LotteryStats> => {
    try {
      const res = await api.get(`/lottery/${lotteryName}/stats`, {
        params: { limit }
      });
      // Em produção sem backend, o fallback de rota do Vercel pode responder 200 com HTML.
      // Valida a forma antes de usar para não quebrar a interface.
      if (res.data && typeof res.data === 'object' && res.data.date_range && res.data.total_results !== undefined) {
        return res.data;
      }
    } catch (err: any) {
      if (!isNetworkError(err)) throw err;
    }

    console.warn('API local offline. Usando estatísticas do mock.');
    const mock = getMockStats(lotteryName, limit);
    if (mock) return mock;
    throw new Error('Backend indisponível e sem dados locais para esta loteria.');
  };

  // Gerar palpites inteligentes
  const getPredict = async (
    lotteryName: string,
    numGames: number = 5,
    strategy: string = 'uniform',
    seed?: number | null
  ): Promise<PredictionResponse> => {
    try {
      const res = await api.get(`/lottery/${lotteryName}/predict`, {
        params: { num_games: numGames, strategy, seed: seed ?? undefined }
      });
      return { ...res.data, data_source: 'api' };
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Gerando jogos no navegador (modo demonstração).');
        const games = generateMockGames(lotteryName, numGames, strategy);
        return {
          lottery: lotteryName.toUpperCase(),
          strategy_used: strategy,
          mode: 'illustrative',
          total_historical_draws_analyzed: MOCK_DRAWS[lotteryName]?.length || 0,
          games,
          notice: 'Modo demonstração: o backend não respondeu e nenhum modelo foi executado.'
        };
      }
      throw err;
    }
  };

  // Odds combinatórias exatas (fonte única de probabilidade)
  const getOdds = async (lotteryName: string, numGames: number = 1): Promise<OddsInfo> => {
    const res = await api.get(`/lottery/${lotteryName}/odds`, {
      params: { num_games: numGames }
    });
    return { ...res.data, lottery_key: canonicalLotteryKey(lotteryName), data_source: 'api' } as OddsInfo;
  };

  // Rodar simulação histórica (backtest)
  const runBacktest = async (
    lotteryName: string,
    numDraws: number = 100,
    numGamesPerDraw: number = 5,
    strategy: string = 'uniform',
    fromStart: boolean = false,
    seed?: number | null
  ): Promise<BacktestResponse> => {
    try {
      const res = await api.post(`/lottery/${lotteryName}/backtest`, null, {
        params: {
          num_draws: numDraws,
          num_games_per_draw: numGamesPerDraw,
          strategy,
          from_start: fromStart,
          seed: seed ?? undefined
        }
      });
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Executando simulação de backtest no cliente.');
        
        const draws = MOCK_DRAWS[lotteryName] || [];
        const availableDraws = draws.slice(0, Math.min(numDraws, draws.length));
        
        const hits_distribution: Record<string, number> = {};
        const rewards_summary: Record<string, number> = {};
        
        const simulations_detail = availableDraws.map((refDraw) => {
          const games = generateMockGames(lotteryName, numGamesPerDraw, strategy);
          let maxHits = 0;
          
          const games_simulated = games.map(game => {
            const hits = game.filter(n => refDraw.numbers.includes(n)).length;
            if (hits > maxHits) maxHits = hits;

            hits_distribution[String(hits)] = (hits_distribution[String(hits)] || 0) + 1;

            let award = 'Nenhum';
            if (lotteryName === 'megasena') {
              if (hits === 4) award = 'Quadra';
              else if (hits === 5) award = 'Quina';
              else if (hits === 6) award = 'Sena';
            } else if (lotteryName === 'lotofacil') {
              if (hits >= 11) award = `${hits} Acertos`;
            } else {
              if (hits === 2) award = 'Duque';
              else if (hits === 3) award = 'Terno';
              else if (hits === 4) award = 'Quadra';
              else if (hits === 5) award = 'Quina';
            }

            if (award !== 'Nenhum') {
              rewards_summary[award] = (rewards_summary[award] || 0) + 1;
            }

            return { game, hits };
          });

          return {
            reference: `Concurso ${refDraw.concurso}`,
            real_numbers: refDraw.numbers,
            max_hits_achieved: maxHits,
            games_simulated
          };
        });

        const hits_by_draw = simulations_detail.map((detail) => ({
          concurso: parseInt(detail.reference.replace('Concurso ', ''), 10) || 0,
          reference: detail.reference,
          max_hits: detail.max_hits_achieved,
        }));

        const allOfflineGames = simulations_detail
          .flatMap((detail, drawIdx) =>
            detail.games_simulated.map((g) => ({
              game: g.game,
              hits: g.hits,
              concurso: parseInt(detail.reference.replace('Concurso ', ''), 10) || 0,
              hit_numbers: g.game.filter((n) => availableDraws[drawIdx].numbers.includes(n)),
            }))
          );
        const top_games = [...allOfflineGames].sort((a, b) => b.hits - a.hits).slice(0, 50);

        return {
          lottery: lotteryName.toUpperCase(),
          strategy_tested: strategy,
          concursos_simulados: availableDraws.length,
          total_apostas_simuladas: availableDraws.length * numGamesPerDraw,
          hits_distribution,
          rewards_summary,
          hits_by_draw,
          top_games,
          from_start: true,
          notice: 'Modo demonstração: backend indisponível. Jogos gerados localmente com dados fictícios; sem valor preditivo.',
          simulations_detail
        };
      }
      throw err;
    }
  };

  // Salvar uma nova coleção (apenas localStorage — privado por dispositivo)
  const saveCollection = async (
    name: string,
    lotteryName: string,
    games: number[][]
  ): Promise<any> => {
    return saveLocalCollection(name, lotteryName, games);
  };

  // Listar todas as coleções (apenas localStorage — privado por dispositivo)
  const listCollections = async (): Promise<GameCollection[]> => {
    return getLocalCollections().map(c => ({
      id: c.id,
      name: c.name,
      lottery_name: c.lottery_name,
      total_games: c.games.length,
      created_at: c.created_at
    }));
  };

  // Detalhes da coleção: conferência contra o último concurso real quando a API responde
  const getCollectionDetail = async (id: number): Promise<CollectionDetail> => {
    const detail = getLocalCollectionDetail(id);
    if (!detail) throw new Error('Coleção não encontrada neste dispositivo.');

    const lotteryKey = canonicalLotteryKey(detail.lottery_name);
    try {
      const latest = await getLatestDraw(lotteryKey);
      const realSet = new Set(latest.numbers);
      return {
        ...detail,
        last_real_draw: {
          reference: latest.reference,
          draw_date: latest.draw_date,
          numbers: latest.numbers,
          source: latest.source,
          stale: latest.stale,
        },
        checking_summary: detail.checking_summary.map((res) => {
          const hits = res.game.filter((n) => realSet.has(n)).length;
          return { ...res, hits_count: hits, award_achieved: awardForHits(lotteryKey, hits) };
        }),
        data_source: 'api',
      };
    } catch (err) {
      console.warn('API indisponível: conferência demonstrativa com dados fictícios.');
      return {
        ...detail,
        data_source: 'demo',
        notice: 'Conferência demonstrativa: o backend não respondeu e foram usados concursos fictícios de exemplo. Este resultado não vale como conferência oficial.',
      };
    }
  };

  // Excluir uma coleção (apenas localStorage)
  const deleteCollection = async (id: number): Promise<any> => {
    deleteLocalCollection(id);
    return { message: 'Coleção excluída com sucesso deste dispositivo.' };
  };

  // Atualizar o nome da coleção (apenas localStorage)
  const updateCollectionName = async (id: number, newName: string): Promise<any> => {
    updateLocalCollection(id, newName);
    return { message: 'Coleção atualizada com sucesso.' };
  };

  // Último concurso real de uma loteria (para conferência honesta)
  const getLatestDraw = async (lotteryName: string): Promise<{
    lottery_name: string;
    reference: string;
    draw_date: string;
    numbers: number[];
    source_url?: string;
    source?: 'caixa-live' | 'database';
    stale?: boolean;
    notice?: string;
  }> => {
    const res = await api.get(`/lottery/${canonicalLotteryKey(lotteryName)}/latest`);
    return res.data;
  };

  // Curva de cobertura real, calculada pelo backend
  const getCoverageCurve = async (params: {
    lottery_name: string;
    selected_numbers: number[];
    guarantee: number;
    condition_hits: number;
  }): Promise<CoverageCurveResponse> => {
    const res = await api.get('/fechamento/coverage-curve', {
      params: {
        lottery_name: params.lottery_name,
        selected_numbers: params.selected_numbers.join(','),
        guarantee: params.guarantee,
        condition_hits: params.condition_hits,
      },
      timeout: 120000,
    });
    return res.data;
  };

  // Mede a cobertura efetiva de um conjunto de apostas (ex.: após pós-filtro)
  const checkCoverage = async (params: {
    lottery_name: string;
    selected_numbers: number[];
    guarantee: number;
    condition_hits: number;
    games: number[][];
  }): Promise<CoverageResult> => {
    const res = await api.post('/fechamento/coverage', params);
    return res.data;
  };

  // Executar fechamento combinatório
  const runFechamento = async (params: FechamentoParams): Promise<FechamentoResult> => {
    try {
      // Fechamento é computacionalmente caro: timeout dedicado, sem fallback local
      const res = await api.post('/fechamento', params, { timeout: 120000 });
      return res.data;
    } catch (err: any) {
      if (err?.code === 'ECONNABORTED' || String(err?.message || '').includes('timeout')) {
        throw new Error('O cálculo do fechamento está demorando. Reduza o número de dezenas ou a garantia.');
      }
      if (isNetworkError(err)) {
        console.warn('API local offline. Executando fechamento combinatório no cliente.');
        const lot = canonicalLotteryKey(params.lottery_name);
        const gameSize = lot === 'megasena' ? 6 : lot === 'lotofacil' ? 15 : 5;
        const localGames = runLocalFechamento(
          params.selected_numbers,
          gameSize,
          params.guarantee,
          params.condition_hits
        );
        return {
          lottery: params.lottery_name,
          selected_numbers: params.selected_numbers,
          game_size: gameSize,
          guarantee: params.guarantee,
          condition_hits: params.condition_hits,
          total_games_generated: localGames.length,
          games: localGames
        };
      }
      throw err;
    }
  };

  return {
    getStats,
    getPredict,
    getOdds,
    runBacktest,
    getLatestDraw,
    getCoverageCurve,
    checkCoverage,
    saveCollection,
    listCollections,
    getCollectionDetail,
    deleteCollection,
    updateCollectionName,
    runFechamento
  };
};
