import React, { useEffect, useState } from 'react';
import { useApi, type LotteryStats } from '../hooks/useApi';
import { TrendingUp, Award, Calendar, RefreshCw, BarChart3, Thermometer, Hash, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardPageProps {
  onNavigateToGenerator: (lottery: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToGenerator }) => {
  const api = useApi();
  const [selectedLottery, setSelectedLottery] = useState<string>('megasena');
  const [limit, setLimit] = useState<number>(100);
  const [stats, setStats] = useState<LotteryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<string>('overview');

  const fetchStats = async (lottery: string, limitVal: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats(lottery, limitVal);
      setStats(data);
    } catch (err: any) {
      setError('Erro ao carregar estatísticas. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedLottery, limit);
  }, [selectedLottery, limit]);

  const lotteries = [
    { id: 'megasena', name: 'Mega-Sena', color: 'border-megasena text-megasena-light hover:bg-megasena/10', activeColor: 'bg-megasena/20 text-megasena-light border-megasena' },
    { id: 'lotofacil', name: 'Lotofácil', color: 'border-lotofacil text-lotofacil-light hover:bg-lotofacil/10', activeColor: 'bg-lotofacil/20 text-lotofacil-light border-lotofacil' },
    { id: 'quina', name: 'Quina', color: 'border-quina text-quina-light hover:bg-quina/10', activeColor: 'bg-quina/20 text-quina-light border-quina' }
  ];

  const getLotteryColor = () => {
    if (selectedLottery === 'megasena') return '#209869';
    if (selectedLottery === 'lotofacil') return '#930053';
    return '#f7a81b';
  };

  // Dados para o gráfico de frequência (top 15)
  const getChartData = () => {
    if (!stats?.most_common_numbers) return [];
    return stats.most_common_numbers.slice(0, 10).map(([num, count]) => ({
      name: String(num).padStart(2, '0'),
      frequencia: count,
    }));
  };

  // Dados para o heatmap
  const getHeatmapData = () => {
    if (!stats?.all_frequencies) return [];
    const cfg = selectedLottery === 'megasena' ? 60 : selectedLottery === 'lotofacil' ? 25 : 80;
    const freqs = stats.all_frequencies || {};
    return Array.from({ length: cfg }, (_, i) => i + 1).map(n => ({
      num: n,
      freq: freqs[String(n)] || 0,
    }));
  };

  // Cor do heatmap baseada na frequência
  const getHeatColor = (freq: number, maxFreq: number) => {
    if (maxFreq === 0) return 'bg-gray-800';
    const ratio = freq / maxFreq;
    if (ratio > 0.8) return 'bg-green-500';
    if (ratio > 0.6) return 'bg-green-400';
    if (ratio > 0.4) return 'bg-yellow-500';
    if (ratio > 0.2) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const heatmapData = getHeatmapData();
  const maxHeatFreq = Math.max(...heatmapData.map(d => d.freq), 0.001);
  const chartData = getChartData();
  const lotteryColor = getLotteryColor();

  const terminatorColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1'];

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'heatmap', label: 'Mapa de Calor', icon: Thermometer },
    { id: 'pairs', label: 'Pares & Terminadores', icon: Hash },
    { id: 'trends', label: 'Tendências', icon: Zap },
  ];

  return (
    <div className="space-y-6 relative z-10">
      <div className="glow-spot bg-blue-500 w-96 h-96 -top-20 -left-20"></div>
      <div className="glow-spot bg-purple-600 w-96 h-96 bottom-10 right-10"></div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Dashboard Estatístico</h2>
          <p className="text-gray-400 mt-1">Análise matemática profunda baseada no acervo histórico oficial da Caixa.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-dark-card/60 border border-dark-border px-3 py-2 rounded-xl">
            <span className="text-xs text-gray-400 font-semibold">Analisar:</span>
            <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}
              className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer">
              <option value="30" className="bg-dark-card">Últimos 30</option>
              <option value="50" className="bg-dark-card">Últimos 50</option>
              <option value="100" className="bg-dark-card">Últimos 100</option>
              <option value="300" className="bg-dark-card">Todo Histórico</option>
            </select>
          </div>
          <div className="flex gap-2 p-1 bg-dark-card/60 border border-dark-border rounded-xl">
            {lotteries.map((lot) => (
              <button key={lot.id} onClick={() => setSelectedLottery(lot.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-300 ${
                  selectedLottery === lot.id ? lot.activeColor : 'border-transparent text-gray-400 hover:text-white'
                }`}>{lot.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegação das Abas de Análise */}
      <div className="flex gap-1.5 p-1 bg-dark-card/40 border border-dark-border rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setViewTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${
                viewTab === tab.id
                  ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 shadow-inner'
                  : 'border border-transparent text-gray-400 hover:text-white'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-80 glass-panel rounded-2xl">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-400 font-medium">Processando estatísticas...</p>
        </div>
      ) : error ? (
        <div className="p-6 glass-panel rounded-2xl border-red-900/30 text-center space-y-4">
          <div className="text-red-500 font-bold text-lg">⚠️ Falha na Conexão</div>
          <p className="text-gray-400 max-w-lg mx-auto">{error}</p>
          <button onClick={() => fetchStats(selectedLottery, limit)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200">
            Tentar Novamente
          </button>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Cards de Resumo (sempre visíveis) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
              <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl"><Award className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Total de Sorteios</div>
                <div className="text-xl font-bold text-white mt-0.5">{stats.total_results}</div>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
              <div className="p-3 bg-green-600/10 text-green-400 rounded-xl"><Calendar className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Período</div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  {new Date(stats.date_range.start).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
              <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Números Analisados</div>
                <div className="text-xl font-bold text-white mt-0.5">{selectedLottery === 'megasena' ? 60 : selectedLottery === 'lotofacil' ? 25 : 80}</div>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 font-medium">Motor Preditivo</div>
                <div className="text-xs text-gray-500 mt-0.5">Pronto para gerar</div>
              </div>
              <button onClick={() => onNavigateToGenerator(selectedLottery)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all">
                Gerar Jogos
              </button>
            </div>
          </div>

          {/* CONTEÚDO DAS ABAS */}
          {viewTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Números Quentes */}
              <div className="glass-panel p-5 rounded-2xl">
                <div className="flex items-center space-x-2 pb-3 border-b border-dark-border">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <h3 className="text-base font-bold text-white">Números Quentes</h3>
                </div>
                <div className="mt-4 space-y-2.5">
                  {stats.most_common_numbers.slice(0, 8).map(([num, count], index) => {
                    const pct = ((count / stats.total_results) * 100).toFixed(1);
                    return (
                      <div key={num} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-4 text-xs text-gray-500 font-bold">{index + 1}º</span>
                          <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-xs font-bold text-green-400">
                            {String(num).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-white">{count}x</div>
                          <div className="text-[10px] text-gray-500">{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Números Frios */}
              <div className="glass-panel p-5 rounded-2xl">
                <div className="flex items-center space-x-2 pb-3 border-b border-dark-border">
                  <TrendingUp className="w-4 h-4 text-red-400 transform rotate-180" />
                  <h3 className="text-base font-bold text-white">Números Frios</h3>
                </div>
                <div className="mt-4 space-y-2.5">
                  {stats.least_common_numbers.slice(0, 8).map(([num, count], index) => {
                    const pct = ((count / stats.total_results) * 100).toFixed(1);
                    return (
                      <div key={num} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-4 text-xs text-gray-500 font-bold">{index + 1}º</span>
                          <div className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-xs font-bold text-red-400">
                            {String(num).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-white">{count}x</div>
                          <div className="text-[10px] text-gray-500">{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico de Barras (Recharts) */}
              <div className="glass-panel p-5 rounded-2xl">
                <h3 className="text-base font-bold text-white pb-3 border-b border-dark-border">Top 10 Frequência</h3>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#12141c', border: '1px solid #1e2230', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        labelStyle={{ color: '#9ca3af' }}
                      />
                      <Bar dataKey="frequencia" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={index} fill={lotteryColor} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tendências (subindo) */}
              {stats.trending_up && stats.trending_up.length > 0 && (
                <div className="glass-panel p-5 rounded-2xl lg:col-span-3">
                  <div className="flex items-center space-x-2 pb-3 border-b border-dark-border">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-base font-bold text-white">🔥 Números em Alta (Tendência Recente)</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 mb-4">Comparação dos últimos 25 sorteios vs histórico total.</p>
                  <div className="flex flex-wrap gap-3">
                    {stats.trending_up.map(([num, diff]) => (
                      <div key={num} className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <span className="text-sm font-bold text-yellow-400">{String(num).padStart(2, '0')}</span>
                        <span className="text-xs text-green-400 font-bold">+{diff}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {viewTab === 'heatmap' && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Thermometer className="w-5 h-5 text-orange-400" />
                Mapa de Calor — Frequência dos Números
              </h3>
              <p className="text-xs text-gray-500 mb-5">Verde = mais frequente | Vermelho = menos frequente</p>
              <div className={`grid gap-1.5 mx-auto w-fit ${
                selectedLottery === 'lotofacil' ? 'grid-cols-5' : selectedLottery === 'megasena' ? 'grid-cols-10' : 'grid-cols-10'
              }`}>
                {heatmapData.map(({ num, freq }) => (
                  <div key={num}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110 ${getHeatColor(freq, maxHeatFreq)} ${
                      freq > maxHeatFreq * 0.4 ? 'text-white' : 'text-gray-300'
                    }`}
                    title={`Nº ${num}: ${(freq * 100).toFixed(1)}%`}>
                    {String(num).padStart(2, '0')}
                  </div>
                ))}
              </div>
              {/* Legenda */}
              <div className="flex items-center gap-3 mt-6 justify-center text-[10px] text-gray-500">
                <span>Menos Frequente</span>
                <div className="flex gap-0.5">
                  <div className="w-4 h-4 rounded bg-red-600"></div>
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <div className="w-4 h-4 rounded bg-green-400"></div>
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                </div>
                <span>Mais Frequente</span>
              </div>
            </div>
          )}

          {viewTab === 'pairs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pares de Números */}
              <div className="glass-panel p-5 rounded-2xl">
                <div className="flex items-center space-x-2 pb-3 border-b border-dark-border">
                  <Hash className="w-4 h-4 text-blue-400" />
                  <h3 className="text-base font-bold text-white">🎯 Pares Mais Frequentes</h3>
                </div>
                <p className="text-xs text-gray-500 mt-2 mb-4">Quais números aparecem juntos com mais frequência.</p>
                {stats.top_pairs && stats.top_pairs.length > 0 ? (
                  <div className="space-y-2.5">
                    {stats.top_pairs.map(([pair, count], index) => {
                      const [n1, n2] = pair.split('-').map(Number);
                      return (
                        <div key={pair} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-bold w-4">{index + 1}º</span>
                            <div className="flex items-center gap-1">
                              <span className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">{String(n1).padStart(2, '0')}</span>
                              <span className="text-gray-600 text-xs">+</span>
                              <span className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">{String(n2).padStart(2, '0')}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-white">{count}x</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-8">Dados insuficientes para análise de pares.</p>
                )}
              </div>

              {/* Terminadores */}
              <div className="glass-panel p-5 rounded-2xl">
                <div className="flex items-center space-x-2 pb-3 border-b border-dark-border">
                  <Hash className="w-4 h-4 text-purple-400" />
                  <h3 className="text-base font-bold text-white">📊 Terminadores (Dígito Final)</h3>
                </div>
                <p className="text-xs text-gray-500 mt-2 mb-4">Distribuição do último dígito dos números sorteados.</p>
                {stats.terminators && stats.terminators.length > 0 ? (
                  <div className="space-y-3">
                    {stats.terminators.map(([digit, count], index) => {
                      const maxCount = Math.max(...stats.terminators!.map(t => t[1]), 1);
                      const widthPct = (count / maxCount) * 100;
                      return (
                        <div key={digit} className="flex items-center gap-3">
                          <span className="w-6 text-xs font-bold text-gray-300">...{digit}</span>
                          <div className="flex-1 bg-dark-bg border border-dark-border rounded-full h-5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 flex items-center justify-end px-2"
                              style={{ width: `${widthPct}%`, backgroundColor: terminatorColors[digit] || '#3b82f6' }}>
                              <span className="text-[10px] font-bold text-white">{count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-8">Dados insuficientes para análise de terminadores.</p>
                )}
              </div>
            </div>
          )}

          {viewTab === 'trends' && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Análise de Tendências por Janela Deslizante
              </h3>
              <p className="text-xs text-gray-500 mb-6">Compara a frequência dos números nos últimos 25 sorteios contra o histórico total. Números com alta recente podem indicar tendência.</p>

              {/* Frequência Relativa com Recharts */}
              <div className="h-72 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(0, 8)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#12141c', border: '1px solid #1e2230', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Bar dataKey="frequencia" name="Frequência" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={index} fill={lotteryColor} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Números em Alta */}
              {stats.trending_up && stats.trending_up.length > 0 && (
                <>
                  <h4 className="text-sm font-bold text-white mt-4 mb-3">🔥 Números com Maior Alta Recente</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {stats.trending_up.map(([num, diff]) => (
                      <div key={num} className="p-3 bg-dark-bg/60 border border-dark-border rounded-xl text-center">
                        <div className="text-lg font-black text-yellow-400">{String(num).padStart(2, '0')}</div>
                        <div className="text-xs text-green-400 font-bold mt-1">+{diff}%</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
