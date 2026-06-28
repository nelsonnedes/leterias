import axios from 'axios';
import {
  getMockStats,
  generateMockGames,
  getLocalCollections,
  saveLocalCollection,
  deleteLocalCollection,
  getLocalCollectionDetail,
  MOCK_DRAWS
} from './mockData';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 2000, // Timeout curto para chaveamento rápido de fallback
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

  // Listar todas as coleções
  const listCollections = async (): Promise<GameCollection[]> => {
    try {
      const res = await api.get('/collections');
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('API local offline. Listando coleções do localStorage.');
        const locals = getLocalCollections();
        return locals.map(c => ({
          id: c.id,
          name: c.name,
          lottery_name: c.lottery_name,
          total_games: c.games.length,
          created_at: c.created_at
        }));
      }
      throw err;
    }
  };

  // Obter detalhes da coleção e conferir acertos
  const getCollectionDetail = async (id: number): Promise<CollectionDetail> => {
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

  return {
    getStats,
    getPredict,
    runBacktest,
    saveCollection,
    listCollections,
    getCollectionDetail,
    deleteCollection
  };
};
