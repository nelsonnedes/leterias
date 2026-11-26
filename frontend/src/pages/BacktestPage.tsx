import React, { useState } from 'react';
import { useApi, type BacktestResponse } from '../hooks/useApi';
import { TrendingUp, RefreshCw, BarChart2, Play, Award, CalendarDays, Save, CheckCircle2 } from 'lucide-react';

export const BacktestPage: React.FC = () => {
  const api = useApi();
  
  // Parâmetros do formulário
  const [lottery, setLottery] = useState<string>('megasena');
  const [numDraws, setNumDraws] = useState<number>(100);
  const [numGamesPerDraw, setNumGamesPerDraw] = useState<number>(5);
  const [strategy, setStrategy] = useState<string>('combined');
  const [fromStart, setFromStart] = useState<boolean>(true);

  // Jogos mais pontuados selecionados para salvar
  const [selectedGames, setSelectedGames] = useState<number[]>([]);
  const [collectionName, setCollectionName] = useState<string>('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Estados de resposta
  const [backtestResult, setBacktestResult] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    setLoading(true);
    setError(null);
    setSavedMessage(null);
    setSelectedGames([]);
    try {
      const data = await api.runBacktest(lottery, numDraws, numGamesPerDraw, strategy, fromStart);
      setBacktestResult(data);
    } catch (err: any) {
      setError('Erro ao rodar simulação histórica. Certifique-se de que o backend possui histórico de concursos populado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSelected = (e: React.FormEvent) => {
    e.preventDefault();
    const topGames = backtestResult?.top_games || [];
    const games = selectedGames
      .map((idx) => topGames[idx]?.game)
      .filter((game): game is number[] => Boolean(game));
    if (!collectionName.trim() || games.length === 0) return;
    api.saveCollection(collectionName.trim(), lottery, games);
    setSavedMessage(`${games.length} jogos salvos na coleção "${collectionName.trim()}".`);
    setCollectionName('');
    setSelectedGames([]);
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
                <option value="ml_ensemble">IA Ensemble (ML 8 Features + Markov + Ciclos)</option>
                <option value="combined">Híbrida (Frequência + Atraso + Tendência + Pares)</option>
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

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-dark-bg/50 border border-dark-border rounded-xl">
              <input
                type="checkbox"
                checked={fromStart}
                onChange={(e) => setFromStart(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm font-semibold text-gray-300">Simular desde o concurso mais antigo</span>
            </label>

            <button
              onClick={handleRunBacktest}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              <span>{loading ? 'Simulando no Passado...' : 'Iniciar Backtest'}</span>
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

              {/* Jogos mais pontuados — seleção para salvar */}
              {backtestResult.top_games && backtestResult.top_games.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dark-border">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-400" /> Jogos Mais Pontuados
                    </h4>
                    <span className="text-xs font-semibold text-blue-400">
                      {selectedGames.length} selecionado(s)
                    </span>
                  </div>

                  <form onSubmit={handleSaveSelected} className="mt-4 flex flex-col md:flex-row gap-2">
                    <input
                      type="text"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      placeholder="Nome da coleção (Ex: Melhores do Backtest)"
                      className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={selectedGames.length === 0 || !collectionName.trim()}
                      className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800/50 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Salvar selecionados
                    </button>
                  </form>

                  {savedMessage && (
                    <div className="mt-3 p-3 bg-green-950/20 border border-green-900/30 text-green-400 rounded-lg text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> {savedMessage}
                    </div>
                  )}

                  <div className="mt-4 max-h-80 overflow-y-auto pr-1 space-y-1.5">
                    {backtestResult.top_games.slice(0, 30).map((item, idx) => {
                      const selected = selectedGames.includes(idx);
                      return (
                        <label
                          key={`${item.concurso}-${idx}`}
                          className={`flex flex-wrap items-center gap-3 px-3 py-2 border rounded-lg cursor-pointer text-xs ${
                            selected
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-dark-bg/40 border-dark-border hover:border-blue-500/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setSelectedGames((prev) =>
                                prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                              )
                            }
                            className="w-4 h-4 accent-green-500"
                          />
                          <span className="font-bold text-gray-400 w-24">Concurso {item.concurso}</span>
                          <span className="flex flex-wrap gap-1 flex-1">
                            {item.game.map((n) => (
                              <span key={n} className="px-1.5 py-0.5 bg-dark-card border border-dark-border rounded font-bold text-gray-300">
                                {String(n).padStart(2, '0')}
                              </span>
                            ))}
                          </span>
                          <span className="font-bold text-green-400">{item.hits} acertos</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Acertos por Concurso — visão compacta de todo o histórico simulado */}
              <div className="glass-panel p-6 rounded-2xl">
                <h4 className="text-lg font-bold text-white pb-3 border-b border-dark-border flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-400" /> Acertos por Concurso
                </h4>
                <p className="text-xs text-gray-500 mt-2 mb-4">
                  {backtestResult.hits_by_draw?.length ?? backtestResult.simulations_detail.length} concursos simulados
                  {backtestResult.from_start ? ' desde o início do histórico' : ''}.
                </p>
                <div className="max-h-96 overflow-y-auto pr-1 space-y-1.5">
                  {(backtestResult.hits_by_draw ?? backtestResult.simulations_detail.map((d) => ({
                    concurso: parseInt(d.reference.replace('Concurso ', ''), 10) || 0,
                    reference: d.reference,
                    max_hits: d.max_hits_achieved,
                  }))).map((item, idx) => (
                    <div key={`${item.reference}-${idx}`} className="flex items-center justify-between px-3 py-2 bg-dark-bg/40 border border-dark-border rounded-lg text-xs font-semibold text-gray-300">
                      <span>{item.reference}</span>
                      <span className="text-green-400 font-bold">{item.max_hits} acertos</span>
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
