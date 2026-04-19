import React, { useState } from 'react';
import { X, Coins, Dice1, Zap, TrendingUp, Shield } from 'lucide-react';

interface CasinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  usdBalance: number;
  bankUsd: number;
  bankRub: number;
  chips: number;
  onChipExchange: (newChips: number, newUsdBalance: number, newBankUsd: number, newBankRub: number) => void;
  onSaveProgress?: () => void;
}

// 🔥 ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОКРУГЛЕНИЯ
const roundTo2 = (num: number) => Math.round(num * 100) / 100;

export const CasinoModal: React.FC<CasinoModalProps> = ({
  isOpen, onClose, usdBalance, bankUsd, bankRub, chips,
  onChipExchange, onSaveProgress
}) => {
  if (!isOpen) return null;

  const [screen, setScreen] = useState<'main' | 'games' | 'dice'>('main');
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  
  // Для игры в дайс
  const [diceBet, setDiceBet] = useState('');
  const [diceChoice, setDiceChoice] = useState<'even' | 'odd'>('even'); // 🔥 ЧЕТНОЕ/НЕЧЕТНОЕ
  const [lastResult, setLastResult] = useState<number | null>(null); // 🔥 ПОКАЗЫВАЕМ ПОСЛЕДНИЙ РЕЗУЛЬТАТ

  // --- ПОКУПКА ФИШЕК ---
  const handleBuyChips = () => {
    const amt = parseFloat(buyAmount);
    if (!amt || amt <= 0) return alert('Введите количество фишек');
    if (amt > usdBalance) return alert(`Недостаточно долларов! У вас $${usdBalance.toFixed(2)}`);
    
    const newUsd = roundTo2(usdBalance - amt);
    const newChips = roundTo2(chips + amt);
    
    onChipExchange(newChips, newUsd, bankUsd, bankRub);
    onSaveProgress?.();
    
    alert(`✅ Куплено ${amt} фишек за $${amt}`);
    setBuyAmount('');
  };

  // --- ПРОДАЖА ФИШЕК ---
  const handleSellChips = () => {
    const amt = parseFloat(sellAmount);
    if (!amt || amt <= 0) return alert('Введите количество фишек');
    if (amt > chips) return alert(`Недостаточно фишек! У вас ${chips.toFixed(2)} фишек.`);
    
    const newUsd = roundTo2(usdBalance + amt);
    const newChips = roundTo2(chips - amt);
    
    onChipExchange(newChips, newUsd, bankUsd, bankRub);
    onSaveProgress?.();
    
    alert(`✅ Продано ${amt} фишек за $${amt}`);
    setSellAmount('');
  };

  // --- ИГРА: ДАЙС (ЧЕТНОЕ/НЕЧЕТНОЕ) ---
  const handleDiceBet = () => {
    const bet = parseFloat(diceBet);
    if (!bet || bet <= 0) return alert('Введите ставку');
    
    if (bet > chips) {
      return alert(`Неверная ставка! У вас только ${chips.toFixed(2)} фишек.`);
    }
    
    // 🔥 МАКСИМАЛЬНО РАНДОМНЫЙ РЕЗУЛЬТАТ (1-100)
    // Используем несколько источников энтропии для лучшей рандомизации
    const timeSeed = Date.now() % 1000;
    const perfSeed = typeof performance !== 'undefined' && performance.now 
      ? Math.floor(performance.now()) % 100 
      : 0;
    const cryptoSeed = typeof crypto !== 'undefined' && crypto.getRandomValues 
      ? crypto.getRandomValues(new Uint32Array(1))[0] % 100 
      : Math.floor(Math.random() * 100);
    
    // Комбинируем источники для максимально непредсказуемого результата
    const combinedSeed = (timeSeed + perfSeed + cryptoSeed + Math.random() * 1000) % 100;
    const result = Math.floor(combinedSeed) + 1; // 1-100
    
    // 🔥 ПРОВЕРКА: ЧЕТНОЕ ИЛИ НЕЧЕТНОЕ
    const isEven = result % 2 === 0;
    const win = (diceChoice === 'even' && isEven) || (diceChoice === 'odd' && !isEven);
    
    // 🔥 ЧЕСТНАЯ МАТЕМАТИКА: множитель 1.95x (RTP 97.5%, house edge 2.5%)
    const payout = win ? roundTo2(bet * 1.95) : 0;
    const newChips = roundTo2(chips - bet + payout);
    
    onChipExchange(newChips, usdBalance, bankUsd, bankRub);
    onSaveProgress?.();
    
    // 🔥 СОХРАНЯЕМ ПОСЛЕДНИЙ РЕЗУЛЬТАТ ДЛЯ ОТОБРАЖЕНИЯ
    setLastResult(result);
    
    const resultText = `${result} (${isEven ? 'Чётное' : 'Нечётное'})`;
    alert(`🎲 Выпало: ${resultText}\n${win ? `✅ Победа! +${payout.toFixed(2)} фишек` : `❌ Проигрыш. -${bet} фишек`}`);
    
    setDiceBet('');
  };

  // СТИЛИ
  const s: any = {
    overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 9999, overflowY: 'auto' },
    container: { maxWidth: 420, margin: '0 auto', padding: '16px 16px 40px', minHeight: '100vh' },
    header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
    backBtn: { background: 'none', border: 'none', padding: 8, cursor: 'pointer' },
    nickname: { fontSize: 22, fontWeight: '800', color: '#fff' },
    chipDisplay: { background: 'linear-gradient(135deg, #FFD60A, #FF9500)', borderRadius: 16, padding: '20px', textAlign: 'center', marginBottom: 24 },
    chipLabel: { fontSize: 14, color: '#000', opacity: 0.8 },
    chipValue: { fontSize: 36, fontWeight: '800', color: '#000', margin: '8px 0' },
    exchangeSection: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 },
    exchangeCard: { background: '#1C1C1E', borderRadius: 16, padding: 16 },
    exchangeTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
    input: { width: '100%', padding: '10px', borderRadius: 10, background: '#2C2C2E', border: '1px solid #3A3A3C', color: '#fff', fontSize: 14, marginBottom: 8 },
    btn: { width: '100%', padding: '10px', borderRadius: 10, border: 'none', fontWeight: '600', fontSize: 13, cursor: 'pointer' },
    btnPrimary: { background: '#007AFF', color: '#fff' },
    btnGreen: { background: '#34C759', color: '#fff' },
    btnRed: { background: '#FF453A', color: '#fff' },
    gamesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    gameCard: { background: '#1C1C1E', borderRadius: 16, padding: 20, cursor: 'pointer', textAlign: 'center' },
    gameIcon: { width: 48, height: 48, borderRadius: 12, background: 'rgba(255, 214, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' },
    gameName: { fontSize: 14, fontWeight: '600', color: '#fff' },
    diceGame: { background: '#1C1C1E', borderRadius: 20, padding: 20 },
    diceControls: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 },
    choiceBtn: { flex: 1, padding: '14px', borderRadius: 12, border: '2px solid transparent', fontWeight: '600', fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' },
    choiceBtnActive: { borderColor: '#007AFF', background: 'rgba(0, 122, 255, 0.15)', color: '#007AFF' },
    choiceBtnInactive: { borderColor: '#3A3A3C', background: '#2C2C2E', color: '#8E8E93' },
    resultDisplay: { textAlign: 'center', padding: '12px', borderRadius: 12, background: 'rgba(255, 214, 10, 0.1)', marginBottom: 16 }
  };

  // ЭКРАН: ГЛАВНОЕ МЕНЮ
  if (screen === 'main') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={onClose} style={s.backBtn}><X size={24} color="#fff" /></button>
            <span style={s.nickname}>Казино</span>
          </div>

          <div style={s.chipDisplay}>
            <div style={s.chipLabel}>Ваши фишки</div>
            <div style={s.chipValue}>🪙 {chips.toFixed(2)}</div>
            <div style={{fontSize: 12, color: '#000', opacity: 0.7}}>Курс: 1$ = 1 фишка</div>
          </div>

          <div style={s.exchangeSection}>
            <div style={s.exchangeCard}>
              <div style={s.exchangeTitle}>🟢 Купить фишки</div>
              <input style={s.input} placeholder="Количество" type="number" value={buyAmount} onChange={e => setBuyAmount(e.target.value)} />
              <button style={{...s.btn, ...s.btnGreen}} onClick={handleBuyChips}>Купить за $</button>
            </div>
            <div style={s.exchangeCard}>
              <div style={s.exchangeTitle}>🔴 Продать фишки</div>
              <input style={s.input} placeholder="Количество" type="number" value={sellAmount} onChange={e => setSellAmount(e.target.value)} />
              <button style={{...s.btn, ...s.btnRed}} onClick={handleSellChips}>Продать за $</button>
            </div>
          </div>

          <div style={s.gamesGrid}>
            <div style={s.gameCard} onClick={() => setScreen('dice')}>
              <div style={s.gameIcon}><Dice1 size={24} color="#FFD60A" /></div>
              <div style={s.gameName}>🎲 Дайс</div>
            </div>
            <div style={{...s.gameCard, opacity: 0.5, cursor: 'not-allowed'}}>
              <div style={s.gameIcon}><Zap size={24} color="#737373" /></div>
              <div style={{...s.gameName, color: '#737373'}}>⚡ Блэкджек</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ЭКРАН: ДАЙС (ЧЕТНОЕ/НЕЧЕТНОЕ)
  if (screen === 'dice') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><X size={24} color="#fff" /></button>
            <span style={s.nickname}>🎲 Дайс</span>
          </div>

          <div style={s.chipDisplay}>
            <div style={s.chipLabel}>Фишки для игры</div>
            <div style={s.chipValue}>🪙 {chips.toFixed(2)}</div>
          </div>

          <div style={s.diceGame}>
            {/* 🔥 ПОКАЗ ПОСЛЕДНЕГО РЕЗУЛЬТАТА */}
            {lastResult !== null && (
              <div style={s.resultDisplay}>
                <div style={{fontSize: 12, color: '#8E8E93', marginBottom: 4}}>Последний бросок:</div>
                <div style={{fontSize: 20, fontWeight: 'bold', color: '#FFD60A'}}>
                  {lastResult} ({lastResult % 2 === 0 ? 'Чётное' : 'Нечётное'})
                </div>
              </div>
            )}

            <div style={{textAlign: 'center', marginBottom: 20}}>
              <div style={{fontSize: 13, color: '#8E8E93'}}>Ставка (фишки)</div>
              <input 
                style={{...s.input, textAlign: 'center', fontSize: 18, fontWeight: 'bold'}} 
                placeholder="0" 
                type="number" 
                value={diceBet} 
                onChange={e => setDiceBet(e.target.value)} 
              />
            </div>

            {/* 🔥 ВЫБОР: ЧЕТНОЕ ИЛИ НЕЧЕТНОЕ */}
            <div style={{display: 'flex', gap: 12, marginBottom: 20}}>
              <button 
                style={{...s.choiceBtn, ...(diceChoice === 'even' ? s.choiceBtnActive : s.choiceBtnInactive)}}
                onClick={() => setDiceChoice('even')}
              >
                🔵 Чётное
              </button>
              <button 
                style={{...s.choiceBtn, ...(diceChoice === 'odd' ? s.choiceBtnActive : s.choiceBtnInactive)}}
                onClick={() => setDiceChoice('odd')}
              >
                🔴 Нечётное
              </button>
            </div>

            {/* 🔥 ИНФОРМАЦИЯ О ШАНСАХ */}
            <div style={{textAlign: 'center', marginBottom: 20, fontSize: 12, color: '#8E8E93'}}>
              Шанс победы: 50% • Выплата: 1.95x • House Edge: 2.5%
            </div>

            <button style={{...s.btn, ...s.btnPrimary, padding: '14px', fontSize: 16}} onClick={handleDiceBet}>
              🎲 Бросить кубик
            </button>

            <div style={{textAlign: 'center', marginTop: 16, fontSize: 11, color: '#666'}}>
              Результат генерируется криптографически случайным образом
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};