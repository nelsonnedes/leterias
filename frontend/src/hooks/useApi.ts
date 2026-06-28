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
}

export interface PredictionResponse {
  lottery: string;
  strategy_used: string;
  total_historical_draws_analyzed: number;
  games: number[][];
}

export interface BacktestResponse {
  lottery: string;
  strategy_tested: string;
  concursos_simulados: number;
  total_apostas_simuladas: number;
  hits_distribution: Record<string, number>;
  rewards_summary: Record<string, number>;
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
  } | null;
  checking_summary: {
    game_index: number;
    game: number[];
    hits_count: number;
    award_achieved: string;
  }[];
}

// Helper para verificar se o erro foi de conexão recusada ou offline
const isNetworkError = (error: any): boolean => {
  return !error.response && (!error.status || error.code === 'ERR_NETWORK' || error.message.includes('timeout'));
};

export const useApi = () => {
  
  // Obter estatísticas básicas
  const getStats = async (lotteryName: string, limit?: number): Promise<LotteryStats> => {
    try {
      const res = await api.get(`/lottery/${lotteryName}/stats`, {
        params: { limit }
      });
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Usando estatísticas do mock.');
        const mock = getMockStats(lotteryName, limit);
        if (mock) return mock;
      }
      throw err;
    }
  };

  // Gerar palpites inteligentes
  const getPredict = async (
    lotteryName: string,
    numGames: number = 1,
    strategy: string = 'combined'
  ): Promise<PredictionResponse> => {
    try {
      const res = await api.get(`/lottery/${lotteryName}/predict`, {
        params: { num_games: numGames, strategy }
      });
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Rodando motor preditivo no cliente.');
        const games = generateMockGames(lotteryName, numGames, strategy);
        return {
          lottery: lotteryName.toUpperCase(),
          strategy_used: strategy,
          total_historical_draws_analyzed: MOCK_DRAWS[lotteryName]?.length || 0,
          games
        };
      }
      throw err;
    }
  };

  // Rodar simulação histórica (backtest)
  const runBacktest = async (
    lotteryName: string,
    numDraws: number = 100,
    numGamesPerDraw: number = 5,
    strategy: string = 'combined'
  ): Promise<BacktestResponse> => {
    try {
      const res = await api.post(`/lottery/${lotteryName}/backtest`, null, {
        params: { num_draws: numDraws, num_games_per_draw: numGamesPerDraw, strategy }
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

        return {
          lottery: lotteryName.toUpperCase(),
          strategy_tested: strategy,
          concursos_simulados: availableDraws.length,
          total_apostas_simuladas: availableDraws.length * numGamesPerDraw,
          hits_distribution,
          rewards_summary,
          simulations_detail
        };
      }
      throw err;
    }
  };

  // Salvar uma nova coleção
  const saveCollection = async (
    name: string,
    lotteryName: string,
    games: number[][]
  ): Promise<any> => {
    try {
      const res = await api.post('/collections', {
        name,
        lottery_name: lotteryName,
        games
      });
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Salvando no localStorage do navegador.');
        return saveLocalCollection(name, lotteryName, games);
      }
      throw err;
    }
  };

  // Listar todas as coleções (mesclando as coleções do SQLite e as do localStorage)
  const listCollections = async (): Promise<GameCollection[]> => {
    const locals = getLocalCollections().map(c => ({
      id: c.id,
      name: `${c.name} (Offline)`,
      lottery_name: c.lottery_name,
      total_games: c.games.length,
      created_at: c.created_at
    }));

    try {
      const res = await api.get('/collections');
      const apiCols = res.data;
      return [...apiCols, ...locals];
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Listando coleções do localStorage.');
        return locals;
      }
      throw err;
    }
  };

  // Obter detalhes da coleção e conferir acertos
  const getCollectionDetail = async (id: number): Promise<CollectionDetail> => {
    // Se o ID for de timestamp (localStorage)
    if (id > 1000000000000) {
      const detail = getLocalCollectionDetail(id);
      if (detail) return detail;
      throw new Error('Coleção local não encontrada.');
    }

    try {
      const res = await api.get(`/collections/${id}`);
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Buscando detalhe de coleção do localStorage.');
        const detail = getLocalCollectionDetail(id);
        if (detail) return detail;
      }
      throw err;
    }
  };

  // Excluir uma coleção
  const deleteCollection = async (id: number): Promise<any> => {
    // Se o ID for de timestamp (localStorage)
    if (id > 1000000000000) {
      deleteLocalCollection(id);
      return { message: 'Coleção offline excluída com sucesso.' };
    }

    try {
      const res = await api.delete(`/collections/${id}`);
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Excluindo coleção do localStorage.');
        deleteLocalCollection(id);
        return { message: 'Coleção offline excluída com sucesso.' };
      }
      throw err;
    }
  };

  // Atualizar o nome da coleção
  const updateCollectionName = async (id: number, newName: string): Promise<any> => {
    if (id > 1000000000000) {
      updateLocalCollection(id, newName);
      return { message: 'Coleção local atualizada com sucesso.' };
    }

    try {
      const res = await api.put(`/collections/${id}`, { name: newName });
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Atualizando nome de coleção no localStorage.');
        updateLocalCollection(id, newName);
        return { message: 'Coleção local atualizada com sucesso.' };
      }
      throw err;
    }
  };

  // Executar fechamento combinatório
  const runFechamento = async (params: FechamentoParams): Promise<FechamentoResult> => {
    try {
      const res = await api.post('/fechamento', params);
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Executando fechamento combinatório no cliente.');
        const lot = params.lottery_name.toLowerCase();
        const gameSize = lot.includes('mega') ? 6 : lot.includes('facil') ? 15 : 5;
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
    runBacktest,
    saveCollection,
    listCollections,
    getCollectionDetail,
    deleteCollection,
    updateCollectionName,
    runFechamento
  };
};
