import React, { useState } from 'react';
import { X, Coins, Dice1, Zap, TrendingUp, Shield } from 'lucide-react';

interface CasinoModalProps {
  isOpen: boolean;
  onClose: () => void; 
  usdBalance: number;
  bankUsd: number;
  bankRub: number;
  chips: number; // 🔥 ДОБАВИЛИ
  onChipExchange: (newChips: number, newBankUsd: number, newBankRub: number) => void; // 🔥 ИЗМЕНИЛИ
  onSaveProgress?: () => void;
}

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
  const [diceRoll, setDiceRoll] = useState<'over' | 'under'>('over');
  const [diceTarget, setDiceTarget] = useState(50);

  // --- ПОКУПКА ФИШЕК ---
  const handleBuyChips = () => {
    const amt = parseFloat(buyAmount);
    if (!amt || amt <= 0) return alert('Введите количество фишек');
    if (amt > usdBalance) return alert('Недостаточно долларов!');
    
    // 🔥 Снимаем доллары с баланса
    const newUsd = usdBalance - amt;
    const newChips = chips + amt;
    
    // 🔥 Обновляем через колбэк
    onChipExchange(newChips, bankUsd, bankRub);
    
    onSaveProgress?.(); // 🔥 Сохраняем в базу
    
    alert(`✅ Куплено ${amt} фишек за $${amt}`);
    setBuyAmount('');
  };

  // --- ПРОДАЖА ФИШЕК ---
  const handleSellChips = () => {
    const amt = parseFloat(sellAmount);
    if (!amt || amt <= 0) return alert('Введите количество фишек');
    if (amt > chips) return alert('Недостаточно фишек!');
    
    // 🔥 Начисляем доллары на баланс
    const newUsd = usdBalance + amt;
    const newChips = chips - amt;
    
    // 🔥 Обновляем через колбэк
    onChipExchange(newChips, bankUsd, bankRub);
    
    onSaveProgress?.(); // 🔥 Сохраняем в базу
    
    alert(`✅ Продано ${amt} фишек за $${amt}`);
    setSellAmount('');
  };

  // --- ИГРА: ДАЙС ---
  const handleDiceBet = () => {
    const bet = parseFloat(diceBet);
    if (!bet || bet <= 0) return alert('Введите ставку');
    
    // 🔥 ПРОВЕРКА: сравниваем с фишками, а не с балансом!
    if (bet > chips) {
      return alert(`Неверная ставка! У вас только ${chips} фишек.`);
    }
    
    // Генерируем результат (1-100)
    const result = Math.floor(Math.random() * 100) + 1;
    const win = diceRoll === 'over' ? result > diceTarget : result < diceTarget;
    const payout = win ? bet * 1.95 : 0; // 95% RTP
    
    // Обновляем фишки
    const newChips = chips - bet + payout;
    onChipExchange(newChips, bankUsd, bankRub);
    onSaveProgress?.();
    
    alert(`🎲 Выпало: ${result}\n${win ? `✅ Победа! +$${payout.toFixed(2)}` : `❌ Проигрыш. -$${bet}`}`);
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
    diceTargetSlider: { width: '100%', accentColor: '#FFD60A' },
    diceResult: { fontSize: 48, fontWeight: '800', color: '#FFD60A', textAlign: 'center', margin: '20px 0' }
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

  // ЭКРАН: ДАЙС
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

            <div style={{display: 'flex', gap: 8, marginBottom: 16}}>
              <button 
                style={{...s.btn, flex: 1, background: diceRoll === 'over' ? '#007AFF' : '#2C2C2E', color: diceRoll === 'over' ? '#fff' : '#8E8E93'}}
                onClick={() => setDiceRoll('over')}
              >
                Больше {diceTarget}
              </button>
              <button 
                style={{...s.btn, flex: 1, background: diceRoll === 'under' ? '#007AFF' : '#2C2C2E', color: diceRoll === 'under' ? '#fff' : '#8E8E93'}}
                onClick={() => setDiceRoll('under')}
              >
                Меньше {diceTarget}
              </button>
            </div>

            <div style={{marginBottom: 20}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8E8E93', marginBottom: 8}}>
                <span>0</span>
                <span>Цель: {diceTarget}</span>
                <span>100</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="90" 
                value={diceTarget} 
                onChange={e => setDiceTarget(parseInt(e.target.value))}
                style={s.diceTargetSlider}
              />
            </div>

            <button style={{...s.btn, ...s.btnPrimary, padding: '14px', fontSize: 16}} onClick={handleDiceBet}>
              🎲 Бросить кубик
            </button>

            <div style={{textAlign: 'center', marginTop: 16, fontSize: 12, color: '#8E8E93'}}>
              Выплата при победе: 1.95x (RTP 95%)
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};