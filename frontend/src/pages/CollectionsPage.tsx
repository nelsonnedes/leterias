import React, { useEffect, useState } from 'react';
import { useApi, type GameCollection, type CollectionDetail } from '../hooks/useApi';
import { Trash2, ChevronRight, Award, Calendar, RefreshCw, X, Edit2, Check } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const api = useApi();
  const [collections, setCollections] = useState<GameCollection[]>([]);
  const [selectedCol, setSelectedCol] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para edição do nome
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listCollections();
      setCollections(data);
    } catch (err: any) {
      setError('Erro ao carregar as coleções salvas no banco de dados SQLite.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCollection = async (id: number) => {
    setDetailLoading(true);
    setIsEditing(false);
    try {
      const data = await api.getCollectionDetail(id);
      setSelectedCol(data);
    } catch (err: any) {
      console.error('Erro ao buscar detalhes da coleção:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteCollection = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza de que deseja excluir esta coleção de apostas de forma definitiva?')) return;
    
    try {
      await api.deleteCollection(id);
      if (selectedCol?.id === id) {
        setSelectedCol(null);
      }
      fetchCollections();
    } catch (err: any) {
      console.error('Erro ao deletar coleção:', err);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim() || !selectedCol) return;
    try {
      await api.updateCollectionName(selectedCol.id, editName.trim());
      setIsEditing(false);
      fetchCollections();
      // Atualiza o detalhe carregado com o novo nome
      setSelectedCol({
        ...selectedCol,
        name: editName.trim()
      });
    } catch (err: any) {
      console.error('Erro ao atualizar nome da coleção:', err);
    }
  };

  const handleShareWhatsApp = () => {
    if (!selectedCol) return;
    
    let text = `📊 *LotoPredict Engine - Conferência de Apostas*\n`;
    text += `*Coleção:* ${selectedCol.name}\n`;
    text += `*Loteria:* ${selectedCol.lottery_name}\n`;
    
    if (selectedCol.last_real_draw) {
      text += `*Concurso:* ${selectedCol.last_real_draw.reference}\n`;
      text += `*Dezenas Sorteadas:* ${selectedCol.last_real_draw.numbers.map(n => String(n).padStart(2, '0')).join(', ')}\n\n`;
    }
    
    text += `*Resultados das Apostas:*\n`;
    selectedCol.checking_summary.forEach(res => {
      const gameStr = res.game.map(n => String(n).padStart(2, '0')).join(' ');
      const awardStr = res.award_achieved !== 'Nenhum' ? `🏆 (${res.award_achieved})` : '';
      text += `- Jogo #${res.game_index}: [ ${gameStr} ] ➜ *${res.hits_count} acertos* ${awardStr}\n`;
    });
    
    text += `\nCalcule seus jogos online no LotoPredict Engine:\nhttps://frontend-delta-six-13.vercel.app/`;
    
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // Cores visuais para os números reais de conferência
  const getLotteryColorClass = (lot: string) => {
    const l = lot.toLowerCase();
    if (l.includes('mega')) return 'bg-megasena border-megasena-light text-white';
    if (l.includes('facil')) return 'bg-lotofacil border-lotofacil-light text-white';
    return 'bg-quina border-quina-light text-white';
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Glow Spots */}
      <div className="glow-spot bg-purple-500 w-96 h-96 -top-20 left-10"></div>
      <div className="glow-spot bg-blue-600 w-96 h-96 bottom-10 right-10"></div>

      <div>
        <h2 className="text-3xl font-extrabold text-white">Minhas Coleções</h2>
        <p className="text-gray-400 mt-1">Gerencie suas apostas salvas e execute a conferência de acertos instantaneamente contra a Caixa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Coleções */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Coleções Salvas</h3>
            <button 
              onClick={fetchCollections} 
              className="p-2 hover:bg-dark-card rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10 glass-panel rounded-2xl">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-center text-sm font-medium">
              {error}
            </div>
          ) : collections.length > 0 ? (
            <div className="space-y-3">
              {collections.map((col) => (
                <div
                  key={col.id}
                  onClick={() => handleSelectCollection(col.id)}
                  className={`glass-panel p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 border-l-4 ${
                    selectedCol?.id === col.id 
                      ? 'border-l-blue-500 bg-blue-500/5' 
                      : col.lottery_name.includes('Mega') ? 'border-l-megasena hover:border-l-blue-500' : col.lottery_name.includes('Fácil') ? 'border-l-lotofacil hover:border-l-blue-500' : 'border-l-quina hover:border-l-blue-500'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white">{col.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{col.lottery_name}</span>
                      <span>•</span>
                      <span>{col.total_games} apostas</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteCollection(col.id, e)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg hover:text-red-300 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 glass-panel rounded-2xl text-center text-gray-400">
              Nenhuma coleção de apostas salva no momento.
            </div>
          )}
        </div>

        {/* Detalhamento e Conferência */}
        <div className="lg:col-span-2">
          {detailLoading ? (
            <div className="flex flex-col items-center justify-center h-80 glass-panel rounded-2xl">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="mt-4 text-gray-400 font-medium">Cruzando dezenas com último concurso real...</p>
            </div>
          ) : selectedCol ? (
            <div className="space-y-6">
              {/* Cabeçalho da Coleção */}
              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden space-y-4">
                <button
                  onClick={() => setSelectedCol(null)}
                  className="absolute top-4 right-4 p-2 bg-dark-bg/60 hover:bg-dark-card rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* Nome e Edição */}
                {isEditing ? (
                  <div className="flex flex-1 max-w-md gap-2 items-center">
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm transition-all duration-300 font-bold"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all cursor-pointer"
                      title="Salvar nome"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white m-0 leading-none">{selectedCol.name}</h3>
                    <button
                      onClick={() => {
                        setEditName(selectedCol.name);
                        setIsEditing(true);
                      }}
                      className="p-1.5 bg-dark-bg/60 hover:bg-dark-card border border-dark-border rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
                      title="Editar nome"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-1">
                  <p className="m-0">Loteria: <span className="font-semibold text-blue-400">{selectedCol.lottery_name}</span></p>
                  
                  {/* Botão do WhatsApp */}
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-3.5 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] font-bold rounded-xl flex items-center gap-2 transition-all duration-300 cursor-pointer text-xs"
                    title="Compartilhar no WhatsApp"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.528 2.016 14.069 1.002 11.45 1c-5.449 0-9.873 4.369-9.877 9.8-.002 1.758.463 3.479 1.343 4.978L1.87 20.25l4.777-1.096z"/>
                    </svg>
                    WhatsApp
                  </button>
                </div>

                {selectedCol.last_real_draw ? (
                  <div className="mt-4 p-4 bg-dark-bg/40 border border-dark-border rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300 font-semibold">
                      <Award className="w-5 h-5 text-green-400" />
                      Conferido contra: {selectedCol.last_real_draw.reference}
                      <span className="text-xs text-gray-500 font-normal">
                        ({new Date(selectedCol.last_real_draw.draw_date).toLocaleDateString('pt-BR')})
                      </span>
                    </div>
                    
                    {/* Números Sorteados Reais */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedCol.last_real_draw.numbers.map((num) => (
                        <div 
                          key={num} 
                          className={`w-8 h-8 rounded-full border flex items-center justify-center font-extrabold text-xs shadow-md ${getLotteryColorClass(selectedCol.lottery_name)}`}
                        >
                          {String(num).padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                    ⚠️ Nenhum concurso real encontrado no banco SQLite para realizar a conferência automática. Rode o Seeding.
                  </div>
                )}
              </div>

              {/* Lista de Jogos e Acertos */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white">Conferência das Apostas</h4>
                
                <div className="space-y-3">
                  {selectedCol.checking_summary.map((res) => {
                    const isWinner = res.award_achieved !== 'Nenhum';
                    return (
                      <div 
                        key={res.game_index} 
                        className={`glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                          isWinner ? 'border border-green-500/30 bg-green-500/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 font-bold text-sm">Jogo #{res.game_index}</span>
                          
                          {/* Números da Aposta */}
                          <div className="flex flex-wrap gap-1.5">
                            {res.game.map((num) => {
                              // Destaca a dezena se ela estiver no sorteio real
                              const hit = selectedCol.last_real_draw?.numbers.includes(num);
                              return (
                                <div 
                                  key={num} 
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs transition-all duration-300 ${
                                    hit 
                                      ? 'bg-green-500 border border-green-400 text-white font-bold scale-110 shadow-md shadow-green-500/20' 
                                      : 'bg-dark-bg border border-dark-border text-gray-400'
                                  }`}
                                >
                                  {String(num).padStart(2, '0')}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Resultado do cruzamento */}
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-xs font-semibold text-gray-400">
                            Acertos: <span className={`font-bold ${res.hits_count > 0 ? 'text-green-400' : 'text-white'}`}>{res.hits_count}</span>
                          </div>
                          
                          {isWinner ? (
                            <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-xs font-extrabold animate-pulse">
                              🏆 {res.award_achieved}
                            </div>
                          ) : (
                            <div className="px-3 py-1.5 bg-dark-bg border border-dark-border text-gray-600 rounded-lg text-xs font-bold">
                              Sem prêmios
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 glass-panel rounded-2xl text-center p-6">
              <Calendar className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
              <h4 className="text-lg font-bold text-white">Nenhuma coleção selecionada</h4>
              <p className="text-gray-400 mt-2 max-w-sm">Selecione uma coleção de apostas na lista lateral para visualizar seus jogos e os resultados da conferência automática.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
