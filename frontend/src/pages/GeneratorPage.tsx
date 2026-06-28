import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Sparkles, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

interface GeneratorPageProps {
  initialLottery?: string;
}

export const GeneratorPage: React.FC<GeneratorPageProps> = ({ initialLottery = 'megasena' }) => {
  const api = useApi();
  
  // Estados do formulário de geração
  const [lottery, setLottery] = useState<string>(initialLottery);
  const [numGames, setNumGames] = useState<number>(5);
  const [strategy, setStrategy] = useState<string>('combined');
  
  // Estados de resposta
  const [generatedGames, setGeneratedGames] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para salvar coleção
  const [collectionName, setCollectionName] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const data = await api.getPredict(lottery, numGames, strategy);
      setGeneratedGames(data.games);
    } catch (err: any) {
      setError('Erro ao se comunicar com o motor preditivo do backend. Verifique se o servidor FastAPI está ligado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionName.trim() || generatedGames.length === 0) return;
    
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      await api.saveCollection(collectionName, lottery, generatedGames);
      setSaveSuccess(true);
      setCollectionName('');
    } catch (err: any) {
      setSaveError('Não foi possível salvar a coleção. Verifique a conexão com a API.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Cores visuais de acordo com a loteria
  const getLotteryColorClass = (lot: string) => {
    const l = lot.toLowerCase();
    if (l.includes('mega')) return { bg: 'bg-megasena/10 border-megasena/30 text-megasena-light', numBg: 'bg-megasena border-megasena-light text-white' };
    if (l.includes('facil')) return { bg: 'bg-lotofacil/10 border-lotofacil/30 text-lotofacil-light', numBg: 'bg-lotofacil border-lotofacil-light text-white' };
    return { bg: 'bg-quina/10 border-quina/30 text-quina-light', numBg: 'bg-quina border-quina-light text-white' };
  };

  const style = getLotteryColorClass(lottery);

  return (
    <div className="space-y-6 relative z-10">
      {/* Glow Spots */}
      <div className="glow-spot bg-green-500 w-96 h-96 -top-20 right-10"></div>
      <div className="glow-spot bg-blue-600 w-96 h-96 bottom-10 left-10"></div>

      <div>
        <h2 className="text-3xl font-extrabold text-white">Gerador Preditivo Filtrado</h2>
        <p className="text-gray-400 mt-1">Crie apostas matemáticas otimizadas e passe-as pela esteira de validação anti-jogos estúpidos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Configurações */}
        <div className="glass-panel p-6 rounded-2xl h-fit space-y-6">
          <h3 className="text-xl font-bold text-white pb-3 border-b border-dark-border flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" /> Parâmetros de Geração
          </h3>
          
          <div className="space-y-4">
            {/* Escolha da Loteria */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Selecione a Loteria</label>
              <select 
                value={lottery} 
                onChange={(e) => {
                  setLottery(e.target.value);
                  setGeneratedGames([]);
                  setSaveSuccess(false);
                }}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all duration-300"
              >
                <option value="megasena">Mega-Sena (6 dezenas / 60 números)</option>
                <option value="lotofacil">Lotofácil (15 dezenas / 25 números)</option>
                <option value="quina">Quina (5 dezenas / 80 números)</option>
              </select>
            </div>

            {/* Escolha da Estratégia */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Estratégia Preditiva</label>
              <select 
                value={strategy} 
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all duration-300"
              >
                <option value="combined">Híbrida (Frequência 60% + Atraso 40%) [Recomendado]</option>
                <option value="frequency">Baseada em Frequência (Números Quentes)</option>
                <option value="delay">Baseada em Atraso (Números Frios/Tendência)</option>
              </select>
            </div>

            {/* Quantidade de Apostas */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-gray-300">
                <label>Quantidade de Jogos</label>
                <span className="text-blue-400 font-bold">{numGames} jogos</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={numGames}
                onChange={(e) => setNumGames(parseInt(e.target.value))}
                className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Filtrando Apostas...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar Jogos
                </>
              )}
            </button>
          </div>
        </div>

        {/* Painel de Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-center text-sm font-medium">
              {error}
            </div>
          )}

          {generatedGames.length > 0 ? (
            <div className="space-y-6">
              {/* Opção para Salvar Coleção */}
              <form onSubmit={handleSaveCollection} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">Gostou desses palpites?</h4>
                  <p className="text-sm text-gray-400 mt-1">Grave-os no seu banco de dados para conferência automática posterior.</p>
                </div>
                
                <div className="flex flex-1 md:max-w-md gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome da coleção (Ex: Jogos da Sorte)"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    required
                    className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition-all duration-300"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all duration-300 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Gravando...' : 'Salvar'}
                  </button>
                </div>
              </form>

              {saveSuccess && (
                <div className="p-4 bg-green-950/20 border border-green-900/30 text-green-400 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Coleção de apostas salva com sucesso no SQLite! Acesse a aba "Minhas Coleções" para conferir.
                </div>
              )}

              {saveError && (
                <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-sm font-medium">
                  {saveError}
                </div>
              )}

              {/* Lista de Jogos Gerados */}
              <div className="space-y-4">
                {generatedGames.map((game, index) => {
                  const sumVal = game.reduce((a, b) => a + b, 0);
                  const pares = game.filter(n => n % 2 === 0).length;
                  const impares = game.length - pares;
                  
                  return (
                    <div key={index} className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Número do Jogo */}
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-bold text-sm">Jogo #{index + 1}</span>
                        
                        {/* Dezenas */}
                        <div className="flex flex-wrap gap-2">
                          {game.map((num) => (
                            <div 
                              key={num} 
                              className={`w-9 h-9 rounded-full border flex items-center justify-center font-extrabold text-sm shadow-md transition-all duration-300 hover:scale-110 ${style.numBg}`}
                            >
                              {String(num).padStart(2, '0')}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Métricas do Jogo */}
                      <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 border-t md:border-t-0 border-dark-border pt-3 md:pt-0">
                        <div className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg">
                          Soma: <span className="text-white font-bold">{sumVal}</span>
                        </div>
                        <div className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg">
                          Paridade: <span className="text-white font-bold">{pares}P / {impares}Í</span>
                        </div>
                        <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
                          Aprovado
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 glass-panel rounded-2xl text-center p-6">
              <Sparkles className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
              <h4 className="text-lg font-bold text-white">Nenhum palpite gerado ainda</h4>
              <p className="text-gray-400 mt-2 max-w-sm">Selecione a loteria desejada na barra lateral e clique em "Gerar Jogos" para iniciar o cálculo preditivo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
