import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
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

export const useApi = () => {
  // Obter estatísticas básicas de uma loteria
  const getStats = async (lotteryName: string): Promise<LotteryStats> => {
    const res = await api.get(`/lottery/${lotteryName}/stats`);
    return res.data;
  };

  // Gerar palpites inteligentes
  const getPredict = async (
    lotteryName: string,
    numGames: number = 1,
    strategy: string = 'combined'
  ): Promise<PredictionResponse> => {
    const res = await api.get(`/lottery/${lotteryName}/predict`, {
      params: { num_games: numGames, strategy }
    });
    return res.data;
  };

  // Rodar simulação histórica (backtest)
  const runBacktest = async (
    lotteryName: string,
    numDraws: number = 100,
    numGamesPerDraw: number = 5,
    strategy: string = 'combined'
  ): Promise<BacktestResponse> => {
    const res = await api.post(`/lottery/${lotteryName}/backtest`, null, {
      params: { num_draws: numDraws, num_games_per_draw: numGamesPerDraw, strategy }
    });
    return res.data;
  };

  // Salvar uma nova coleção
  const saveCollection = async (
    name: string,
    lotteryName: string,
    games: number[][]
  ): Promise<any> => {
    const res = await api.post('/collections', {
      name,
      lottery_name: lotteryName,
      games
    });
    return res.data;
  };

  // Listar todas as coleções
  const listCollections = async (): Promise<GameCollection[]> => {
    const res = await api.get('/collections');
    return res.data;
  };

  // Obter detalhes da coleção e conferir acertos
  const getCollectionDetail = async (id: number): Promise<CollectionDetail> => {
    const res = await api.get(`/collections/${id}`);
    return res.data;
  };

  // Excluir uma coleção
  const deleteCollection = async (id: number): Promise<any> => {
    const res = await api.delete(`/collections/${id}`);
    return res.data;
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
