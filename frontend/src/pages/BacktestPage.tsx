import React, { useState } from 'react';
import { useApi, type BacktestResponse } from '../hooks/useApi';
import { TrendingUp, RefreshCw, BarChart2, Play, Award } from 'lucide-react';

export const BacktestPage: React.FC = () => {
  const api = useApi();
  
  // Parâmetros do formulário
  const [lottery, setLottery] = useState<string>('megasena');
  const [numDraws, setNumDraws] = useState<number>(100);
  const [numGamesPerDraw, setNumGamesPerDraw] = useState<number>(5);
  const [strategy, setStrategy] = useState<string>('combined');

  // Estados de resposta
  const [backtestResult, setBacktestResult] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.runBacktest(lottery, numDraws, numGamesPerDraw, strategy);
      setBacktestResult(data);
    } catch (err: any) {
      setError('Erro ao rodar simulação histórica. Certifique-se de que o backend possui histórico de concursos populado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Glow Spots */}
      <div className="glow-spot bg-blue-500 w-96 h-96 -top-20 right-10"></div>
      <div className="glow-spot bg-indigo-600 w-96 h-96 bottom-10 left-10"></div>

      <div>
        <h2 className="text-3xl font-extrabold text-white">Simulador de Backtesting</h2>
        <p className="text-gray-400 mt-1">Valide a eficácia do motor matemático preditivo confrontando palpites contra resultados históricos reais.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Configuração */}
        <div className="glass-panel p-6 rounded-2xl h-fit space-y-6">
          <h3 className="text-xl font-bold text-white pb-3 border-b border-dark-border flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-400" /> Parâmetros de Simulação
          </h3>

          <div className="space-y-4">
            {/* Escolha da Loteria */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Loteria</label>
              <select 
                value={lottery} 
                onChange={(e) => {
                  setLottery(e.target.value);
                  setBacktestResult(null);
                }}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all duration-300"
              >
                <option value="megasena">Mega-Sena</option>
                <option value="lotofacil">Lotofácil</option>
                <option value="quina">Quina</option>
              </select>
            </div>

            {/* Escolha da Estratégia */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Estratégia</label>
              <select 
                value={strategy} 
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all duration-300"
              >
                <option value="combined">Híbrida (Quentes + Atrasadas)</option>
                <option value="frequency">Apenas Frequência (Mais sorteadas)</option>
                <option value="delay">Apenas Atraso (Mais atrasadas)</option>
              </select>
            </div>

            {/* Concursos Históricos */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-gray-300">
                <label>Quantidade de Concursos</label>
                <span className="text-blue-400 font-bold">{numDraws} sorteios</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="200" 
                step="5"
                value={numDraws}
                onChange={(e) => setNumDraws(parseInt(e.target.value))}
                className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Jogos por Concurso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-gray-300">
                <label>Apostas por Concurso</label>
                <span className="text-blue-400 font-bold">{numGamesPerDraw} jogos</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={numGamesPerDraw}
                onChange={(e) => setNumGamesPerDraw(parseInt(e.target.value))}
                className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <button
              onClick={handleRunBacktest}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Simulando no Passado...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Iniciar Backtest
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resultados do Backtest */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-center text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 glass-panel rounded-2xl">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="mt-4 text-gray-400 font-medium">O motor está processando os concursos do banco SQLite...</p>
            </div>
          ) : backtestResult ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-5 rounded-2xl">
                  <div className="text-sm text-gray-400 font-medium">Concursos Testados</div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {backtestResult.concursos_simulados} sorteios
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Total de {backtestResult.total_apostas_simuladas} apostas virtuais simuladas.</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-green-500/10 bg-green-500/5">
                  <div className="text-sm text-gray-400 font-medium text-green-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Premiações Obtidas
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {Object.entries(backtestResult.rewards_summary).map(([label, val]) => (
                      <div key={label} className="text-xs">
                        <span className="text-gray-400 capitalize">{label.split(' ')[0]}:</span>{' '}
                        <span className="font-bold text-white">{val} vezes</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Distribuição de Acertos */}
              <div className="glass-panel p-6 rounded-2xl">
                <h4 className="text-lg font-bold text-white pb-3 border-b border-dark-border">Distribuição de Acertos</h4>
                
                <div className="mt-6 space-y-4">
                  {Object.entries(backtestResult.hits_distribution)
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                    .map(([hits, count]) => {
                      const percent = ((count / backtestResult.total_apostas_simuladas) * 100).toFixed(1);
                      const maxCount = Math.max(...Object.values(backtestResult.hits_distribution));
                      const widthPercent = (count / maxCount) * 100;
                      
                      return (
                        <div key={hits} className="flex items-center gap-4 text-xs font-semibold text-gray-400">
                          <span className="w-16 font-bold text-gray-300">{hits} acertos</span>
                          
                          <div className="flex-1 bg-dark-bg border border-dark-border rounded-full h-3 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${widthPercent}%` }}
                            ></div>
                          </div>
                          
                          <span className="w-20 text-right text-white font-bold">{count} jogos ({percent}%)</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Log de Simulações */}
              <div className="glass-panel p-6 rounded-2xl">
                <h4 className="text-lg font-bold text-white pb-3 border-b border-dark-border">Log de Simulação (Últimos 5 Concursos)</h4>
                
                <div className="mt-4 space-y-4">
                  {backtestResult.simulations_detail.slice(0, 5).map((detail, idx) => (
                    <div key={idx} className="p-3 bg-dark-bg/40 border border-dark-border rounded-xl space-y-2">
                      <div className="flex justify-between text-xs font-bold text-gray-300">
                        <span>{detail.reference}</span>
                        <span className="text-green-400">Máx Acertos: {detail.max_hits_achieved}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[10px] font-bold text-gray-400">
                        <span>Sorteado:</span>
                        {detail.real_numbers.map(n => (
                          <span key={n} className="px-1 bg-dark-card border border-dark-border rounded">{String(n).padStart(2, '0')}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 glass-panel rounded-2xl text-center p-6">
              <TrendingUp className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
              <h4 className="text-lg font-bold text-white">Aguardando Execução</h4>
              <p className="text-gray-400 mt-2 max-w-sm">Defina os parâmetros de simulação histórica na barra lateral e clique em "Iniciar Backtest".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
