import { useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { BacktestPage } from './pages/BacktestPage';
import { LayoutDashboard, Sparkles, FolderHeart, BarChart3 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [preselectedLottery, setPreselectedLottery] = useState<string>('megasena');

  const handleNavigateToGenerator = (lottery: string) => {
    setPreselectedLottery(lottery);
    setActiveTab('generator');
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'generator', label: 'Gerador Preditivo', icon: Sparkles },
    { id: 'collections', label: 'Minhas Coleções', icon: FolderHeart },
    { id: 'backtest', label: 'Simulador (Backtest)', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-200 flex flex-col antialiased">
      {/* Cabeçalho */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 border-b border-dark-border backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white m-0 p-0 leading-none">
                LotoPredict <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent font-normal">Engine</span>
              </h1>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Matemática Preditiva v1.0</span>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="flex flex-wrap justify-center gap-1.5 p-1 bg-dark-bg border border-dark-border rounded-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 shadow-inner' 
                      : 'border border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'dashboard' && (
          <DashboardPage onNavigateToGenerator={handleNavigateToGenerator} />
        )}
        {activeTab === 'generator' && (
          <GeneratorPage initialLottery={preselectedLottery} />
        )}
        {activeTab === 'collections' && (
          <CollectionsPage />
        )}
        {activeTab === 'backtest' && (
          <BacktestPage />
        )}
      </main>

      {/* Rodapé */}
      <footer className="border-t border-dark-border bg-dark-card/20 py-6 mt-12 text-center text-xs text-gray-600">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 LotoPredict Engine. Construído puramente sob fundamentos matemáticos e de probabilidade.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
