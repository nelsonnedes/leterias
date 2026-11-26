import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Save, Trash2, CheckCircle2 } from 'lucide-react';

interface GameGroupPanelProps {
  lottery: string;
  games: number[][];
  onRemove: (index: number) => void;
  onClear: () => void;
  onSaved?: () => void;
  note?: string;
}

export const GameGroupPanel: React.FC<GameGroupPanelProps> = ({
  lottery,
  games,
  onRemove,
  onClear,
  onSaved,
  note,
}) => {
  const api = useApi();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || games.length === 0) return;
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      await api.saveCollection(name.trim(), lottery, games);
      setSaved(`${games.length} jogo(s) salvo(s) juntos em "${name.trim()}".`);
      setName('');
      onSaved?.();
    } catch (err) {
      console.error('Erro ao salvar grupo:', err);
      setError('Não foi possível salvar o grupo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-white">Grupo de jogos pendente ({games.length})</h4>
          <p className="text-[11px] text-gray-400">
            {note ?? 'Os jogos ficam agrupados aqui e se acumulam entre execuções. Salve todos juntos em Minhas Coleções quando quiser.'}
          </p>
        </div>
        {games.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpar grupo
          </button>
        )}
      </div>

      {games.length > 0 && (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {games.map((game, index) => (
            <div
              key={`${[...game].sort((a, b) => a - b).join(',')}-${index}`}
              className="flex items-center justify-between px-2 py-1.5 bg-dark-bg/60 border border-dark-border rounded-lg text-[11px]"
            >
              <span className="text-gray-300">{game.map((n) => String(n).padStart(2, '0')).join(' ')}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remover jogo ${index + 1} do grupo`}
                className="text-red-300 hover:text-red-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da coleção"
          className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white text-sm"
        />
        <button
          type="submit"
          disabled={games.length === 0 || !name.trim() || saving}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800/50 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar grupo em Minhas Coleções'}
        </button>
      </form>

      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      {saved && (
        <p role="status" className="text-xs text-green-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> {saved}
        </p>
      )}
    </div>
  );
};
