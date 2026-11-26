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

  // Pós-filtro
  const [posFilter, setPosFilter] = useState<boolean>(true);
  const [filteredGames, setFilteredGames] = useState<number[][] | null>(null);
  const [lastFilteredGames, setLastFilteredGames] = useState<number[][] | null>(null);
  const [showFilteredCount, setShowFilteredCount] = useState<number>(0);
  const [showAll, setShowAll] = useState<boolean>(false);

  // Curva de cobertura real (calculada no backend)
  const [coverageCurve, setCoverageCurve] = useState<{num_bets: number; coverage_pct: number}[]>([]);
  const [requiredBets, setRequiredBets] = useState<number>(0);
  const [effectiveCoverage, setEffectiveCoverage] = useState<number | null>(null);

  // Preenchimento rápido do volante (critérios descritivos, não preditivos)
  const [quickLoading, setQuickLoading] = useState<boolean>(false);
  const [quickMessage, setQuickMessage] = useState<string | null>(null);

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
  const displayLotteryName = lottery === 'megasena' ? 'Mega-Sena' : lottery === 'lotofacil' ? 'Lotofácil' : 'Quina';

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
    setQuickMessage(null);
  };

  const handleQuickSelect = async (mode: 'hot' | 'cold' | 'mix' | 'collections') => {
    setQuickLoading(true);
    setQuickMessage(null);
    setError(null);
    setResults(null);
    setSaveSuccess(false);

    try {
      const limit = currentSpec.maxAllowed;
      let chosen: number[] = [];

      if (mode === 'collections') {
        const collections = await api.listCollections();
        const sameLottery = collections.filter((c) => c.lottery_name === displayLotteryName);
        const targets = sameLottery.length > 0 ? sameLottery : collections;
        if (targets.length === 0) {
          setQuickMessage('Você ainda não tem coleções salvas neste dispositivo.');
          return;
        }
        const counts = new Map<number, number>();
        for (const col of targets) {
          const detail = await api.getCollectionDetail(col.id);
          for (const res of detail.checking_summary) {
            for (const n of res.game) counts.set(n, (counts.get(n) ?? 0) + 1);
          }
        }
        chosen = [...counts.entries()]
          .sort((a, b) => b[1] - a[1] || a[0] - b[0])
          .map(([n]) => n);
        if (chosen.length === 0) {
          setQuickMessage('As coleções salvas ainda não contêm jogos para esta loteria.');
          return;
        }
        setQuickMessage(
          `${targets.length} coleção(ões) usadas como referência. Seleção descritiva — sem ganho de chance.`,
        );
      } else {
        const stats = await api.getStats(lottery, 300);
        const hot = (stats.most_common_numbers ?? []).map(([n]) => n);
        const cold = (stats.least_common_numbers ?? []).map(([n]) => n);
        if (mode === 'hot') chosen = hot;
        else if (mode === 'cold') chosen = cold;
        else {
          const half = Math.floor(limit / 2);
          chosen = [...hot.slice(0, half), ...cold.slice(0, limit - half)];
        }
        chosen = [...new Set(chosen)].slice(0, limit);
        if (chosen.length === 0) {
          setQuickMessage('Não há histórico suficiente para preencher as dezenas.');
          return;
        }
        setQuickMessage('Volante preenchido com estatísticas descritivas (quentes/frios). Isso não aumenta a chance de acerto.');
      }

      setSelectedNumbers(chosen.slice(0, limit).sort((a, b) => a - b));
    } catch (err) {
      console.error('Erro no preenchimento rápido:', err);
      setQuickMessage('Não foi possível buscar os dados. Tente novamente.');
    } finally {
      setQuickLoading(false);
    }
  };

  // Filtros estatísticos (mesmos do mockData) para pós-processamento
  const isParityOk = (numbers: number[], min: number, max: number) => {
    const pares = numbers.filter(n => n % 2 === 0).length;
    return pares >= min && pares <= max;
  };

  const isSumOk = (numbers: number[], min: number, max: number) => {
    const total = numbers.reduce((a, b) => a + b, 0);
    return total >= min && total <= max;
  };

  const isConsecutiveOk = (numbers: number[], maxSeq: number) => {
    const sorted = [...numbers].sort((a, b) => a - b);
    let seq = 1, maxS = 1;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] === sorted[i] + 1) { seq++; maxS = Math.max(maxS, seq); } else { seq = 1; }
    }
    return maxS <= maxSeq;
  };

  const getSumRange = () => {
    if (lottery === 'megasena') return { min: 120, max: 220 };
    if (lottery === 'lotofacil') return { min: 160, max: 230 };
    return { min: 150, max: 250 };
  };

  const getParityRange = () => {
    if (lottery === 'megasena') return { min: 2, max: 4 };
    if (lottery === 'lotofacil') return { min: 6, max: 9 };
    return { min: 2, max: 3 };
  };

  const handleGenerate = async () => {
    if (selectedNumbers.length < currentSpec.toDraw) {
      setError(`Selecione pelo menos ${currentSpec.toDraw} dezenas para gerar o fechamento.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    setFilteredGames(null);
    setCoverageCurve([]);
    setRequiredBets(0);
    setEffectiveCoverage(null);

    try {
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
      
      // Pós-filtro: aplica filtros estatísticos sobre os jogos gerados
      let filtered: number[][] = [];
      if (posFilter && data.games.length > 0) {
        const sumRange = getSumRange();
        const parityRange = getParityRange();
        const maxConsec = lottery === 'lotofacil' ? 3 : 2;

        filtered = data.games.filter(game =>
          isSumOk(game, sumRange.min, sumRange.max) &&
          isParityOk(game, parityRange.min, parityRange.max) &&
          isConsecutiveOk(game, maxConsec)
        );
        setFilteredGames(filtered);
        setLastFilteredGames(filtered);
        setShowFilteredCount(data.games.length - filtered.length);
        setShowAll(false);
      } else {
        setFilteredGames(null);
        setLastFilteredGames(null);
        setShowAll(true);
      }

      // Curva de cobertura real, calculada pelo backend
      try {
        const curveData = await api.getCoverageCurve({
          lottery_name: displayLotteryName,
          selected_numbers: selectedNumbers,
          guarantee,
          condition_hits: conditionHits,
        });
        setCoverageCurve(curveData.curve);
        setRequiredBets(curveData.required_bets);

        if (posFilter) {
          const measured = await api.checkCoverage({
            lottery_name: displayLotteryName,
            selected_numbers: selectedNumbers,
            guarantee,
            condition_hits: conditionHits,
            games: filtered,
          });
          setEffectiveCoverage(measured.coverage_pct);
          if (measured.coverage_pct < 100) {
            // Nunca esconder jogos que sustentam a garantia
            setShowAll(true);
          }
        }
      } catch (err) {
        console.warn('Não foi possível calcular a cobertura real:', err);
      }

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
    const gamesToSave = showAll || !lastFilteredGames ? results.games : lastFilteredGames;
    try {
      await api.saveCollection(collectionName.trim(), displayLotteryName, gamesToSave);
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
        <p className="text-gray-400 mt-1">Gere desdobramentos combinatórios que cobrem combinações dentro de um conjunto de dezenas escolhido por você. Isso não aumenta a chance de acertar todos os números do sorteio.</p>
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

          {/* Preenchimento rápido das dezenas */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white">Preencher dezenas automaticamente</h3>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Atalhos para montar o volante. Nenhum deles aumenta a chance combinatória de acerto.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={quickLoading}
                onClick={() => handleQuickSelect('hot')}
                className="px-2 py-2.5 rounded-xl bg-dark-bg/60 border border-dark-border hover:border-blue-500/60 text-[11px] font-bold text-gray-200 cursor-pointer disabled:opacity-50"
              >
                Números quentes
                <span className="block text-[9px] font-normal text-gray-500">mais frequentes no histórico</span>
              </button>
              <button
                type="button"
                disabled={quickLoading}
                onClick={() => handleQuickSelect('cold')}
                className="px-2 py-2.5 rounded-xl bg-dark-bg/60 border border-dark-border hover:border-blue-500/60 text-[11px] font-bold text-gray-200 cursor-pointer disabled:opacity-50"
              >
                Números frios
                <span className="block text-[9px] font-normal text-gray-500">menos frequentes no histórico</span>
              </button>
              <button
                type="button"
                disabled={quickLoading}
                onClick={() => handleQuickSelect('mix')}
                className="px-2 py-2.5 rounded-xl bg-dark-bg/60 border border-dark-border hover:border-blue-500/60 text-[11px] font-bold text-gray-200 cursor-pointer disabled:opacity-50"
              >
                Mix quentes + frios
                <span className="block text-[9px] font-normal text-gray-500">metade de cada grupo</span>
              </button>
              <button
                type="button"
                disabled={quickLoading}
                onClick={() => handleQuickSelect('collections')}
                className="px-2 py-2.5 rounded-xl bg-dark-bg/60 border border-dark-border hover:border-blue-500/60 text-[11px] font-bold text-gray-200 cursor-pointer disabled:opacity-50"
              >
                Mix das minhas coleções
                <span className="block text-[9px] font-normal text-gray-500">dezenas mais usadas nos jogos salvos</span>
              </button>
            </div>
            {quickMessage && (
              <p role="status" className="text-[10px] text-blue-300 leading-relaxed">{quickLoading ? 'Buscando dados...' : quickMessage}</p>
            )}
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

          {/* Pós-filtro */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Pós-Filtro Estatístico
            </h4>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Aplica filtros de soma, paridade e consecutivos para reduzir jogos improváveis.
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-5 rounded-full transition-all duration-300 ${posFilter ? 'bg-blue-600' : 'bg-dark-border'}`}>
                <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-all duration-300 ${posFilter ? 'ml-5' : 'ml-0.5'}`}></div>
              </div>
              <input type="checkbox" checked={posFilter} onChange={() => setPosFilter(!posFilter)} className="hidden" />
              <span className="text-xs font-semibold text-gray-300">{posFilter ? 'Ativado' : 'Desativado'}</span>
            </label>
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

              {/* Pós-filtro: indicador e redução */}
              {filteredGames && posFilter && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
                  effectiveCoverage !== null && effectiveCoverage < 100
                    ? 'bg-red-950/20 border border-red-900/40'
                    : 'bg-green-950/20 border border-green-900/30'
                }`}>
                  <ShieldCheck className={`w-5 h-5 ${effectiveCoverage !== null && effectiveCoverage < 100 ? 'text-red-400' : 'text-green-400'}`} />
                  <div>
                    <span className={`font-bold ${effectiveCoverage !== null && effectiveCoverage < 100 ? 'text-red-400' : 'text-green-400'}`}>
                      Pós-filtro aplicado
                    </span>
                    <span className="text-gray-400 ml-2">
                      {showFilteredCount} jogos removidos por critérios de formato (soma, paridade, consecutivos).
                      {effectiveCoverage !== null && (
                        <> Cobertura efetiva após o filtro: <strong className="text-white">{effectiveCoverage}%</strong>.</>
                      )}
                    </span>
                    {effectiveCoverage !== null && effectiveCoverage < 100 && (
                      <p className="text-xs text-red-300 mt-1">
                        A garantia original não está assegurada: apostas que sustentavam a cobertura foram removidas. Os jogos completos foram reexibidos.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Curva Custo x Probabilidade */}
              {coverageCurve.length > 0 && (
                <div className="glass-panel p-4 rounded-xl border-l-4 border-l-blue-500/50">
                  <h4 className="text-xs font-bold text-white mb-2">📈 Curva de Cobertura Real</h4>
                  <p className="text-[10px] text-gray-400 mb-3">
                    Cobertura calculada pelo motor para os subsets do seu conjunto.
                    {requiredBets > 0 && ` Cobertura completa a partir de ${requiredBets} apostas.`}
                  </p>
                  <div className="space-y-1.5">
                    {coverageCurve.filter((_, i) => i % Math.max(1, Math.floor(coverageCurve.length / 5)) === 0 || i === coverageCurve.length - 1).map(pt => (
                      <div key={pt.num_bets} className="flex items-center gap-2 text-[10px]">
                        <span className="w-6 text-gray-500 font-bold">{pt.num_bets}x</span>
                        <div className="flex-1 bg-dark-bg border border-dark-border rounded-full h-2.5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-400" style={{ width: `${pt.coverage_pct}%` }}></div>
                        </div>
                        <span className="w-12 text-right text-white font-bold">{pt.coverage_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Botões de toggle entre jogos originais e filtrados */}
              {lastFilteredGames && posFilter && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAll(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${showAll ? 'bg-blue-600 text-white' : 'bg-dark-bg border border-dark-border text-gray-400'}`}
                  >
                    Todos ({results.total_games_generated})
                  </button>
                  <button
                    onClick={() => setShowAll(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!showAll ? 'bg-green-600 text-white' : 'bg-dark-bg border border-dark-border text-gray-400'}`}
                  >
                    Filtrados ({lastFilteredGames.length})
                  </button>
                </div>
              )}

              {/* Lista Visual de Jogos */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Relação de Volantes Combinados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {(showAll || !lastFilteredGames ? results.games : lastFilteredGames).map((game, idx) => (
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
