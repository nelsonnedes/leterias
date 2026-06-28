import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Layers, CheckCircle2, Save, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export const ClosingPage: React.FC = () => {
  const api = useApi();
  
  // Estados de formulário
  const [lottery, setLottery] = useState<string>('lotofacil');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [guarantee, setGuarantee] = useState<number>(14);
  const [conditionHits, setConditionHits] = useState<number>(15);
  
  // Estados de execução
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{
    total_games_generated: number;
    games: number[][];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para salvar coleção
  const [collectionName, setCollectionName] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Limitações de dezenas para evitar timeout / estouro de RAM no serverless
  const LOTTERY_SPECS: Record<string, {
    total: number;
    toDraw: number;
    maxAllowed: number;
    defaultGuarantee: number;
    defaultCondition: number;
    guarantees: number[];
  }> = {
    megasena: {
      total: 60,
      toDraw: 6,
      maxAllowed: 12,
      defaultGuarantee: 5,
      defaultCondition: 6,
      guarantees: [4, 5],
    },
    lotofacil: {
      total: 25,
      toDraw: 15,
      maxAllowed: 20,
      defaultGuarantee: 14,
      defaultCondition: 15,
      guarantees: [11, 12, 13, 14],
    },
    quina: {
      total: 80,
      toDraw: 5,
      maxAllowed: 10,
      defaultGuarantee: 4,
      defaultCondition: 5,
      guarantees: [3, 4],
    }
  };

  const currentSpec = LOTTERY_SPECS[lottery];

  const handleLotteryChange = (newLottery: string) => {
    setLottery(newLottery);
    setSelectedNumbers([]);
    setResults(null);
    setError(null);
    setSaveSuccess(false);
    
    const spec = LOTTERY_SPECS[newLottery];
    setGuarantee(spec.defaultGuarantee);
    setConditionHits(spec.defaultCondition);
  };

  const handleNumberClick = (num: number) => {
    setError(null);
    setSaveSuccess(false);
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= currentSpec.maxAllowed) {
        setError(`Limite de dezenas atingido! Para a ${lottery === 'megasena' ? 'Mega-Sena' : lottery === 'lotofacil' ? 'Lotofácil' : 'Quina'}, você pode selecionar no máximo ${currentSpec.maxAllowed} dezenas no fechamento.`);
        return;
      }
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const handleClear = () => {
    setSelectedNumbers([]);
    setResults(null);
    setError(null);
    setSaveSuccess(false);
  };

  const handleGenerate = async () => {
    if (selectedNumbers.length < currentSpec.toDraw) {
      setError(`Selecione pelo menos ${currentSpec.toDraw} dezenas para gerar o fechamento.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      const displayLotteryName = lottery === 'megasena' ? 'Mega-Sena' : lottery === 'lotofacil' ? 'Lotofácil' : 'Quina';
      const data = await api.runFechamento({
        lottery_name: displayLotteryName,
        selected_numbers: selectedNumbers,
        guarantee: guarantee,
        condition_hits: conditionHits
      });
      
      setResults({
        total_games_generated: data.total_games_generated,
        games: data.games
      });
      
      // Sugere um nome para a coleção
      setCollectionName(`Fechamento ${displayLotteryName} - ${selectedNumbers.length} Dezenas`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao calcular o fechamento combinatório no servidor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCollection = async () => {
    if (!results || !collectionName.trim()) return;
    try {
      const displayLotteryName = lottery === 'megasena' ? 'Mega-Sena' : lottery === 'lotofacil' ? 'Lotofácil' : 'Quina';
      await api.saveCollection(collectionName.trim(), displayLotteryName, results.games);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar coleção:', err);
    }
  };

  const getLotteryHeaderColor = () => {
    if (lottery === 'megasena') return 'from-megasena to-megasena-light';
    if (lottery === 'lotofacil') return 'from-lotofacil to-lotofacil-light';
    return 'from-quina to-quina-light';
  };

  const getNumberColorClass = (num: number) => {
    const isSelected = selectedNumbers.includes(num);
    if (!isSelected) return 'bg-dark-bg border-dark-border hover:border-gray-500 text-gray-400';
    
    if (lottery === 'megasena') return 'bg-megasena border-megasena text-white shadow-md shadow-megasena/20';
    if (lottery === 'lotofacil') return 'bg-lotofacil border-lotofacil text-white shadow-md shadow-lotofacil/20';
    return 'bg-quina border-quina text-white shadow-md shadow-quina/20';
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Glow Spots */}
      <div className="glow-spot bg-blue-600 w-96 h-96 -top-20 left-10"></div>
      <div className="glow-spot bg-emerald-600 w-96 h-96 bottom-10 right-10"></div>

      <div>
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Layers className="w-8 h-8 text-blue-500" />
          Fechamentos Matemáticos
        </h2>
        <p className="text-gray-400 mt-1">Gere desdobramentos combinatórios puros e garanta premiações com o menor custo se as dezenas forem sorteadas no seu conjunto.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Configurações */}
        <div className="lg:col-span-1 space-y-6">
          {/* Seletor de Loteria */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">1. Selecione a Loteria</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['megasena', 'lotofacil', 'quina'] as const).map((lot) => {
                const isActive = lottery === lot;
                const label = lot === 'megasena' ? 'Mega-Sena' : lot === 'lotofacil' ? 'Lotofácil' : 'Quina';
                return (
                  <button
                    key={lot}
                    onClick={() => handleLotteryChange(lot)}
                    className={`py-3 text-xs font-extrabold rounded-xl border transition-all duration-300 cursor-pointer ${
                      isActive
                        ? lot === 'megasena' ? 'bg-megasena/15 border-megasena text-megasena-light' : lot === 'lotofacil' ? 'bg-lotofacil/15 border-lotofacil text-lotofacil-light' : 'bg-quina/15 border-quina text-quina-light'
                        : 'bg-dark-bg/60 border-dark-border text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regras e Garantias */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              2. Parâmetros de Garantia
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Garantia de Acerto Mínimo:</label>
                <select
                  value={guarantee}
                  onChange={(e) => setGuarantee(Number(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm font-semibold"
                >
                  {currentSpec.guarantees.map(g => (
                    <option key={g} value={g}>{g} Acertos</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Se acertar (Condição):</label>
                <select
                  value={conditionHits}
                  onChange={(e) => setConditionHits(Number(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm font-semibold"
                >
                  {/* Condições permitidas */}
                  <option value={currentSpec.toDraw}>{currentSpec.toDraw} Dezenas Sorteadas</option>
                </select>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  A garantia só é válida se {currentSpec.toDraw} dezenas sorteadas oficiais da Caixa estiverem dentro do seu conjunto de números selecionados.
                </span>
              </div>
            </div>
          </div>

          {/* Instruções de Limites */}
          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-500/50 space-y-2">
            <h4 className="text-sm font-bold text-white m-0">Restrições de Processamento</h4>
            <p className="text-xs text-gray-400 m-0 leading-relaxed">
              Para assegurar que o cálculo combinatório seja concluído de forma instantânea e sem timeout na hospedagem, existem limites de dezenas selecionáveis:
            </p>
            <ul className="text-xs text-gray-400 m-0 pl-4 space-y-1">
              <li>Mega-Sena: Escolha no máximo <strong>12 números</strong>.</li>
              <li>Lotofácil: Escolha no máximo <strong>20 números</strong>.</li>
              <li>Quina: Escolha no máximo <strong>10 números</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Volante de Seleção de Números */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            {/* Faixa Superior com Info de Progresso */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Selecione suas Dezenas</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Marcados: <span className="font-extrabold text-blue-400">{selectedNumbers.length}</span> de no máximo <span className="font-extrabold text-white">{currentSpec.maxAllowed}</span>
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-dark-bg/60 hover:bg-dark-card border border-dark-border text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading || selectedNumbers.length < currentSpec.toDraw}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedNumbers.length >= currentSpec.toDraw
                      ? `bg-gradient-to-r ${getLotteryHeaderColor()} text-white shadow-lg`
                      : 'bg-dark-bg border border-dark-border text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Gerar Fechamento
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Grid do Volante */}
            <div className={`grid gap-2 justify-center mx-auto ${
              lottery === 'lotofacil' ? 'grid-cols-5 max-w-[280px]' : lottery === 'megasena' ? 'grid-cols-6 sm:grid-cols-10 max-w-[500px]' : 'grid-cols-8 sm:grid-cols-10 max-w-[500px]'
            }`}>
              {Array.from({ length: currentSpec.total }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center font-extrabold text-xs transition-all duration-200 cursor-pointer ${getNumberColorClass(num)}`}
                >
                  {String(num).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          {/* Resultados Combinatórios */}
          {results && (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              {/* Resumo Gerado */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-dark-border">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                    Fechamento Gerado com Sucesso!
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Garantia: Mínimo de <strong>{guarantee} pontos</strong> se {currentSpec.toDraw} sorteados caírem nas suas <strong>{selectedNumbers.length} dezenas</strong>.
                  </p>
                </div>
                
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-black text-white">{results.total_games_generated}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Apostas Geradas</div>
                </div>
              </div>

              {/* Formulário de Salvar Coleção */}
              <div className="p-4 bg-dark-bg/40 border border-dark-border rounded-xl flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Nome para esta Coleção:</label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="Ex: Fechamento Lotofácil 18 Dezenas"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm font-bold"
                  />
                </div>
                <button
                  onClick={handleSaveCollection}
                  disabled={!collectionName.trim() || saveSuccess}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 md:mt-5 cursor-pointer ${
                    saveSuccess
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saveSuccess ? 'Coleção Salva!' : 'Salvar Coleção'}
                </button>
              </div>

              {/* Lista Visual de Jogos */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Relação de Volantes Combinados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {results.games.map((game, idx) => (
                    <div key={idx} className="p-3 bg-dark-bg/60 border border-dark-border rounded-xl flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Aposta #{idx + 1}</span>
                      <div className="flex flex-wrap gap-1">
                        {game.map(num => (
                          <div 
                            key={num} 
                            className="w-7 h-7 rounded-lg bg-dark-bg border border-dark-border flex items-center justify-center font-extrabold text-[10px] text-gray-300"
                          >
                            {String(num).padStart(2, '0')}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
