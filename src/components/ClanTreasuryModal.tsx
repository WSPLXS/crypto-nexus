import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClanTreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clan: any;
  myRole: number;
  userId: number;
  playerUsd: number;
  playerRub: number;
  onPlayerUpdate: (newUsd: number, newRub: number) => void;
  onClanUpdate: () => void;
}

export const ClanTreasuryModal: React.FC<ClanTreasuryModalProps> = ({
  isOpen, onClose, clan, myRole, userId, playerUsd, playerRub, onPlayerUpdate, onClanUpdate
}) => {
  if (!isOpen || !clan) return null;
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const isLeader = myRole === 4;

  const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

  const handleTransaction = async (type: 'deposit' | 'withdraw', currency: 'usd' | 'rub') => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return alert('Введите сумму больше 0');

    setLoading(true);
    try {
      const playerCol = currency === 'usd' ? 'balance' : 'rub_balance';
      const clanCol = currency === 'usd' ? 'treasury_usd' : 'treasury_rub';

      const currentClanVal = clan[clanCol] || 0;
      const currentPlayerVal = currency === 'usd' ? playerUsd : playerRub;

      if (type === 'deposit' && num > currentPlayerVal) {
        return alert(`Недостаточно средств на вашем балансе!`);
      }
      if (type === 'withdraw' && num > currentClanVal) {
        return alert(`В общаке недостаточно средств!`);
      }

      const newValPlayer = type === 'deposit' ? currentPlayerVal - num : currentPlayerVal + num;
      const newValClan = type === 'deposit' ? currentClanVal + num : currentClanVal - num;

      // 1. Обновляем игрока
      const { error: pErr } = await supabase.from('users').update({ [playerCol]: newValPlayer }).eq('id', userId);
      if (pErr) throw pErr;

      // 2. Обновляем клан
      const { error: cErr } = await supabase.from('clans').update({ [clanCol]: newValClan }).eq('id', clan.id);
      if (cErr) throw cErr;

      // 3. Мгновенно обновляем UI
      if (currency === 'usd') onPlayerUpdate(newValPlayer, playerRub);
      else onPlayerUpdate(playerUsd, newValPlayer);

      onClanUpdate();
      setAmount('');
      alert(`✅ Успешно ${type === 'deposit' ? 'внесено' : 'выведено'}: ${num}${currency === 'usd' ? '$' : '₽'}`);
    } catch (err: any) {
      console.error(err);
      alert(`❌ Ошибка транзакции: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <h2 style={styles.title}>🏦 Общак клана</h2>

        <div style={styles.balanceCard}>
          <div style={styles.balanceRow}>
            <span style={styles.label}>💵 Доллары</span>
            <span style={styles.value}>${fmt(clan.treasury_usd || 0)}</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.balanceRow}>
            <span style={styles.label}>💴 Рубли</span>
            <span style={styles.value}>₽{fmt(clan.treasury_rub || 0)}</span>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <input
            style={styles.input}
            type="number"
            placeholder="Введите сумму..."
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Кнопки внесения */}
        <div style={styles.actions}>
          <button onClick={() => handleTransaction('deposit', 'usd')} disabled={loading} style={{...styles.btn, background: '#22c55e'}}>
            <ArrowUpRight size={18} /> Внести $
          </button>
          <button onClick={() => handleTransaction('deposit', 'rub')} disabled={loading} style={{...styles.btn, background: '#3b82f6'}}>
            <ArrowUpRight size={18} /> Внести ₽
          </button>
        </div>

        {/* Кнопки вывода (ТОЛЬКО ДЛЯ ЛИДЕРА) */}
        {isLeader && (
          <div style={{...styles.actions, marginTop: 12}}>
            <button onClick={() => handleTransaction('withdraw', 'usd')} disabled={loading} style={{...styles.btn, background: '#ef4444'}}>
              <ArrowDownLeft size={18} /> Вывести $
            </button>
            <button onClick={() => handleTransaction('withdraw', 'rub')} disabled={loading} style={{...styles.btn, background: '#f59e0b'}}>
              <ArrowDownLeft size={18} /> Вывести ₽
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  modal: { background: '#141414', border: '1px solid rgba(156,163,175,0.15)', borderRadius: 20, padding: 24, width: '90%', maxWidth: 340, position: 'relative' },
  closeBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#e5e5e5', marginBottom: 20, textAlign: 'center' },
  balanceCard: { background: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 20 },
  balanceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' },
  label: { color: '#a3a3a3', fontSize: 14 },
  value: { color: '#22c55e', fontSize: 18, fontWeight: 'bold', wordBreak: 'break-all', overflowWrap: 'break-word', maxWidth: '60%' },
  divider: { height: 1, background: '#333', margin: '8px 0' },
  inputGroup: { marginBottom: 16 },
  input: { width: '100%', padding: '12px', borderRadius: 12, background: '#0a0a0a', border: '1px solid #404040', color: 'white', boxSizing: 'border-box', outline: 'none', fontSize: 16, textAlign: 'center' },
  actions: { display: 'flex', gap: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 12, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }
};