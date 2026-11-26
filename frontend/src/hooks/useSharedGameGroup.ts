import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lotopredict_game_group_v1';

export const gameKey = (game: number[]) => [...game].sort((a, b) => a - b).join(',');

/** Grupo de jogos pendente, compartilhado por todos os geradores e persistido no dispositivo. */
export const useSharedGameGroup = () => {
  const [games, setGames] = useState<number[][]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    } catch {
      /* armazenamento indisponível */
    }
  }, [games]);

  const addGames = useCallback((incoming: number[][]) => {
    setGames((prev) => {
      const existing = new Set(prev.map(gameKey));
      const additions = incoming
        .filter((game) => !existing.has(gameKey(game)))
        .map((game) => [...game]);
      const added = additions.length;
      if (added > 0) {
        setMessage(`${added} jogo(s) adicionado(s) ao grupo.`);
      } else {
        setMessage('Esses jogos já estão no grupo.');
      }
      return [...prev, ...additions];
    });
  }, []);

  const toggleGame = useCallback((game: number[]) => {
    const key = gameKey(game);
    setGames((prev) =>
      prev.some((g) => gameKey(g) === key)
        ? prev.filter((g) => gameKey(g) !== key)
        : [...prev, [...game]],
    );
    setMessage(null);
  }, []);

  const removeAt = useCallback((index: number) => {
    setGames((prev) => prev.filter((_, i) => i !== index));
    setMessage(null);
  }, []);

  const clear = useCallback(() => {
    setGames([]);
    setMessage('Grupo limpo.');
  }, []);

  return { games, addGames, toggleGame, removeAt, clear, message, setMessage };
};
