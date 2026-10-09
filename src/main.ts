import { Game } from './core/Game';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  // Expose to window for debugging if needed
  (window as unknown as { __GAME__: Game }).__GAME__ = game;
  console.log('🎮 Streamer Simulator 2 запущено успішно!');
});
