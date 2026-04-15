import React, { useState } from 'react';
import { X, Coins, Gamepad2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { CASINO_GAMES } from '../data/economy';

interface CasinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  usdBalance: number;
  rubBalance: number;
  bankUsd: number;
  bankRub: number;
  chips: number;
  onChipExchange: (newChips: number, newBankUsd: number, newBankRub: number) => void;
  onSaveProgress?: () => void; // 🔥 НОВЫЙ ПРОПС
}

export const CasinoModal: React.FC<CasinoModalProps> = ({
  isOpen,
  onClose,
  usdBalance,
  rubBalance,
  chips,
  onChipExchange,
  onSaveProgress // 🔥 Добавили проп
}) => {
  if (!isOpen) return null;
  const [tab, setTab] = useState<'exchange' | 'games'>('exchange');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExchange = (direction: 'buy' | 'sell') => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return alert('Введите сумму');

    if (direction === 'buy') {
      // Покупаем фишки за $
      if (usdBalance < num) return alert('Недостаточно долларов на балансе!');
      onChipExchange(chips + num, usdBalance - num, rubBalance);
      onSaveProgress?.(); // 🔥 Сохраняем после покупки
    } else {
      // Продаем фишки обратно в $
      if (chips < num) return alert('Недостаточно фишек!');
      onChipExchange(chips - num, usdBalance + num, rubBalance);
      onSaveProgress?.(); // 🔥 Сохраняем после продажи
    }
    setAmount('');
  };

  const playGame = (game: any) => {
    const bet = parseFloat(prompt(`Ставка для ${game.name} (мин ${game.minBet}):`) || '0');
    if (!bet || bet < game.minBet || bet > chips * game.maxBetPercent) return alert('❌ Неверная ставка');
    
    setLoading(true);
    setTimeout(() => {
      const win = Math.random() > 0.48; // 48% шанс победы (House edge 4%)
      if (win) {
        onChipExchange(chips + bet, usdBalance, rubBalance);
        alert(`🎉 Выигрыш! +${bet} фишек`);
      } else {
        onChipExchange(chips - bet, usdBalance, rubBalance);
        alert(`😔 Проигрыш. -${bet} фишек`);
      }
      onSaveProgress?.(); // 🔥 Сохраняем после игры
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <div style={styles.header}><Gamepad2 size={24} color="#a855f7" /><h2 style={styles.title}>Казино</h2></div>

        <div style={styles.tabs}>
          {['exchange', 'games'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}>
              {t === 'exchange' ? 'Фишки' : 'Игры'}
            </button>
          ))}
        </div>

        {tab === 'exchange' && (
          <div style={styles.content}>
            <div style={styles.chipDisplay}>
              <Coins size={48} color="#fbbf24" />
              <span style={{ fontSize: 32, fontWeight: '800', color: '#fff' }}>{chips}</span>
              <span style={{ color: '#737373', fontSize: 14 }}>Фишек</span>
            </div>
            <div style={styles.balanceInfo}>Ваш баланс: ${usdBalance.toFixed(2)}</div>

            <input
              style={styles.input}
              placeholder="Сумма в $"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => handleExchange('buy')} style={styles.btnBuy}>
                <ArrowUpRight size={18} /> Купить
              </button>
              <button onClick={() => handleExchange('sell')} style={styles.btnSell}>
                <ArrowDownLeft size={18} /> Продать
              </button>
            </div>
            <p style={{ color: '#737373', fontSize: 11, textAlign: 'center', marginTop: 8 }}>Курс: 1 Фишка = $1</p>
          </div>
        )}

        {tab === 'games' && (
          <div style={styles.list}>
            {CASINO_GAMES.map(g => (
              <div key={g.id} style={styles.gameItem} onClick={() => !loading && playGame(g)}>
                <span style={{ fontSize: 28 }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={styles.gameName}>{g.name}</div>
                  <div style={styles.gameSub}>Мин. ставка: {g.minBet}</div>
                </div>
                <ArrowUpRight size={20} color="#a855f7" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: any = {
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: '#141414', border: '1px solid #a855f7', borderRadius: 24, padding: 20, width: '90%', maxWidth: 360, position: 'relative' as const },
  closeBtn: { position: 'absolute' as const, top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', margin: 0 },
  tabs: { display: 'flex', background: '#1a1a1a', borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'transparent', color: '#737373', fontWeight: '600' as const, cursor: 'pointer', fontSize: 13 },
  tabActive: { background: '#a855f7', color: '#fff' },
  content: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  chipDisplay: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 12 },
  balanceInfo: { color: '#34C759', fontSize: 14, fontWeight: 'bold', marginBottom: 8, background: 'rgba(52, 199, 89, 0.1)', padding: '8px 16px', borderRadius: 12 },
  input: { width: '100%', padding: '12px', borderRadius: 12, background: '#0a0a0a', border: '1px solid #404040', color: 'white', boxSizing: 'border-box' as const, outline: 'none', fontSize: 16, textAlign: 'center' as const },
  btnBuy: { flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' },
  btnSell: { flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  gameItem: { background: '#1a1a1a', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'background 0.2s' },
  gameName: { color: '#fff', fontWeight: 'bold' as const, fontSize: 15 },
  gameSub: { color: '#737373', fontSize: 11 }
};