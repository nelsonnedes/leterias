import { useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { BacktestPage } from './pages/BacktestPage';
import { LayoutDashboard, Sparkles, FolderHeart, BarChart3, Heart, Mail, Check, Copy, X } from 'lucide-react';

// Função de cálculo de CRC16 CCITT oficial para o Pix
function crc16(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  for (let i = 0; i < data.length; i++) {
    const b = data.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      const bit = ((b >> (7 - j) & 1) === 1);
      const c15 = ((crc >> 15 & 1) === 1);
      crc <<= 1;
      if (c15 !== bit) crc ^= polynomial;
    }
  }
  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Geração do Pix Copia e Cola estático
const generatePixCode = (): string => {
  const key = 'nedes1@hotmail.com';
  const name = 'Nelson Brito';
  const city = 'SAO PAULO';
  
  const part1 = '000201';
  const merchantAccount = `26${(38 + key.length).toString().padStart(2, '0')}0014br.gov.bcb.pix01${key.length.toString().padStart(2, '0')}${key}`;
  const category = '52040000';
  const currency = '5303986';
  const country = '5802BR';
  const merchantName = `59${name.length.toString().padStart(2, '0')}${name}`;
  const merchantCity = `60${city.length.toString().padStart(2, '0')}${city}`;
  const additionalData = '62070503***';
  
  const payload = `${part1}${merchantAccount}${category}${currency}${country}${merchantName}${merchantCity}${additionalData}6304`;
  return `${payload}${crc16(payload)}`;
};

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [preselectedLottery, setPreselectedLottery] = useState<string>('megasena');
  const [showPixModal, setShowPixModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleNavigateToGenerator = (lottery: string) => {
    setPreselectedLottery(lottery);
    setActiveTab('generator');
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(generatePixCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'generator', label: 'Gerador Preditivo', icon: Sparkles },
    { id: 'collections', label: 'Minhas Coleções', icon: FolderHeart },
    { id: 'backtest', label: 'Simulador (Backtest)', icon: BarChart3 },
  ];

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generatePixCode())}`;

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
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <p className="m-0">© 2026 LotoPredict Engine. Construído sob fundamentos matemáticos e de probabilidade.</p>
            <p className="m-0 text-gray-500">
              Desenvolvedor: <span className="font-bold text-gray-400">Nelson Brito</span> | Contato:{' '}
              <a href="mailto:nedes1@hotmail.com" className="hover:text-blue-400 transition-colors flex inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> nedes1@hotmail.com
              </a>
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowPixModal(true)}
              className="px-4 py-2 bg-pink-600/10 hover:bg-pink-600/25 border border-pink-500/20 text-pink-400 font-bold rounded-xl flex items-center gap-2 transition-all duration-300 cursor-pointer text-xs"
            >
              <Heart className="w-4 h-4 fill-current" />
              Apoiar Projeto (PIX)
            </button>
          </div>
        </div>
      </footer>

      {/* Modal do PIX */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl relative overflow-hidden text-center space-y-6">
            <button
              onClick={() => setShowPixModal(false)}
              className="absolute top-4 right-4 p-2 bg-dark-bg/60 hover:bg-dark-card rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
              <Heart className="w-6 h-6 fill-current" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Apoie o LotoPredict Engine</h3>
              <p className="text-xs text-gray-400 mt-1">Sua doação ajuda a manter a pesquisa de probabilidade ativa.</p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-3 rounded-2xl w-fit mx-auto shadow-xl">
              <img 
                src={qrCodeUrl} 
                alt="QR Code PIX para doação" 
                className="w-44 h-44"
              />
            </div>

            {/* Informações Recebedor */}
            <div className="bg-dark-bg/50 border border-dark-border rounded-2xl p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Beneficiário:</span>
                <span className="text-white font-bold">Nelson Brito</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Instituição:</span>
                <span className="text-white font-bold">Mercado Pago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Chave Pix:</span>
                <span className="text-white font-bold">nedes1@hotmail.com</span>
              </div>
            </div>

            {/* Botão Copiar Código */}
            <button
              onClick={handleCopyPix}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                copied 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Pix Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Pix Copia e Cola
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
