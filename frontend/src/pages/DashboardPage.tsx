import React, { useEffect, useState } from 'react';
import { useApi, type LotteryStats } from '../hooks/useApi';
import { TrendingUp, Award, Calendar, RefreshCw } from 'lucide-react';

interface DashboardPageProps {
  onNavigateToGenerator: (lottery: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToGenerator }) => {
  const api = useApi();
  const [selectedLottery, setSelectedLottery] = useState<string>('megasena');
  const [stats, setStats] = useState<LotteryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (lottery: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats(lottery);
      setStats(data);
    } catch (err: any) {
      setError('Erro ao carregar estatísticas do banco de dados SQLite local. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedLottery);
  }, [selectedLottery]);

  const lotteries = [
    { id: 'megasena', name: 'Mega-Sena', color: 'border-megasena text-megasena-light hover:bg-megasena/10', activeColor: 'bg-megasena/20 text-megasena-light border-megasena' },
    { id: 'lotofacil', name: 'Lotofácil', color: 'border-lotofacil text-lotofacil-light hover:bg-lotofacil/10', activeColor: 'bg-lotofacil/20 text-lotofacil-light border-lotofacil' },
    { id: 'quina', name: 'Quina', color: 'border-quina text-quina-light hover:bg-quina/10', activeColor: 'bg-quina/20 text-quina-light border-quina' }
  ];

  return (
    <div className="space-y-6 relative z-10">
      {/* Glow Spots de Fundo */}
      <div className="glow-spot bg-blue-500 w-96 h-96 -top-20 -left-20"></div>
      <div className="glow-spot bg-purple-600 w-96 h-96 bottom-10 right-10"></div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Dashboard Estatístico</h2>
          <p className="text-gray-400 mt-1">Análise matemática profunda baseada no acervo histórico oficial da Caixa.</p>
        </div>

        {/* Seletores de Loteria */}
        <div className="flex gap-2 p-1 bg-dark-card/60 border border-dark-border rounded-xl backdrop-blur-md self-start">
          {lotteries.map((lot) => (
            <button
              key={lot.id}
              onClick={() => setSelectedLottery(lot.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 ${
                selectedLottery === lot.id ? lot.activeColor : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {lot.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 glass-panel rounded-2xl">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-400 font-medium">Processando estatísticas do SQLite...</p>
        </div>
      ) : error ? (
        <div className="p-6 glass-panel rounded-2xl border-red-900/30 text-center space-y-4">
          <div className="text-red-500 font-bold text-lg">⚠️ Falha na Conexão</div>
          <p className="text-gray-400 max-w-lg mx-auto">{error}</p>
          <button 
            onClick={() => fetchStats(selectedLottery)} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200"
          >
            Tentar Novamente
          </button>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Resumo */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
              <div className="p-4 bg-blue-600/10 text-blue-400 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium">Total de Sorteios</div>
                <div className="text-2xl font-bold text-white mt-1">{stats.total_results} concursos</div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
              <div className="p-4 bg-green-600/10 text-green-400 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium">Período Analisado</div>
                <div className="text-md font-semibold text-white mt-1">
                  {new Date(stats.date_range.start).toLocaleDateString('pt-BR')} a {new Date(stats.date_range.end).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 font-medium">Motor de Previsão</div>
                <div className="text-sm text-gray-500 font-medium mt-1">Pronto para gerar apostas otimizadas</div>
              </div>
              <button
                onClick={() => onNavigateToGenerator(selectedLottery)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all duration-200 shadow-md"
              >
                Gerar Jogos
              </button>
            </div>
          </div>

          {/* Dezenas Mais Frequentes */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-4 border-b border-dark-border">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-bold text-white">Números Quentes</h3>
              </div>
              <p className="text-sm text-gray-400 mt-2">Dezenas com a maior taxa de sorteio histórico.</p>
              
              <div className="mt-6 space-y-3">
                {stats.most_common_numbers.map(([num, count], index) => {
                  const percentage = ((count / stats.total_results) * 100).toFixed(1);
                  return (
                    <div key={num} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-5 text-sm text-gray-500 font-bold">{index + 1}º</span>
                        <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-sm font-bold text-green-400">
                          {String(num).padStart(2, '0')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{count} saídas</div>
                        <div className="text-xs text-gray-500">{percentage}% dos sorteios</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dezenas Menos Frequentes (Atrasadas) */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-4 border-b border-dark-border">
                <TrendingUp className="w-5 h-5 text-red-400 transform rotate-180" />
                <h3 className="text-lg font-bold text-white">Números Frios</h3>
              </div>
              <p className="text-sm text-gray-400 mt-2">Dezenas com a menor frequência registrada no banco.</p>
              
              <div className="mt-6 space-y-3">
                {stats.least_common_numbers.map(([num, count], index) => {
                  const percentage = ((count / stats.total_results) * 100).toFixed(1);
                  return (
                    <div key={num} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-5 text-sm text-gray-500 font-bold">{index + 1}º</span>
                        <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-sm font-bold text-red-400">
                          {String(num).padStart(2, '0')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{count} saídas</div>
                        <div className="text-xs text-gray-500">{percentage}% dos sorteios</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Distribuição Gráfica Simples */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col">
            <h3 className="text-lg font-bold text-white pb-4 border-b border-dark-border">Frequência Relativa</h3>
            <p className="text-sm text-gray-400 mt-2 mb-6">Comparação gráfica simplificada das 5 principais dezenas.</p>
            
            <div className="flex-1 flex flex-col justify-around">
              {stats.most_common_numbers.slice(0, 5).map(([num, count]) => {
                const maxCount = stats.most_common_numbers[0][1];
                const widthPercent = (count / maxCount) * 100;
                return (
                  <div key={num} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span className="font-bold text-gray-300">Dezena {String(num).padStart(2, '0')}</span>
                      <span>{count} saídas</span>
                    </div>
                    <div className="w-full bg-dark-bg border border-dark-border rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedLottery === 'megasena' ? 'bg-megasena' : selectedLottery === 'lotofacil' ? 'bg-lotofacil' : 'bg-quina'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
