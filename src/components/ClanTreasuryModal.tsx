import React from 'react';
import { X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface ClanTreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clan: any;
  myRole: number;
  onRefreshClan: () => void;
}

export const ClanTreasuryModal: React.FC<ClanTreasuryModalProps> = ({
  isOpen, onClose, clan, myRole, onRefreshClan
}) => {
  if (!isOpen || !clan) return null;

  const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  const isLeader = myRole === 4;

  const handleDonate = async (currency: 'usd' | 'rub') => {
    const amount = prompt(`Сколько ${currency === 'usd' ? '$' : '₽'} внести в общак?`);
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    
    const num = Number(amount);
    // Логика доната упрощена для примера, если нужно - подключим к балансу игрока
    alert(`✅ Внесено ${num}${currency === 'usd' ? '$' : '₽'} в общак!`);
    onRefreshClan();
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

        {isLeader && (
          <div style={styles.actions}>
            <button onClick={() => handleDonate('usd')} style={styles.btn}>
              <ArrowUpRight size={18} /> Внести $
            </button>
            <button onClick={() => handleDonate('rub')} style={styles.btn}>
              <ArrowUpRight size={18} /> Внести ₽
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
  value: { 
    color: '#22c55e', 
    fontSize: 18, 
    fontWeight: 'bold', 
    wordBreak: 'break-all', // 🔥 Защита от переполнения
    overflowWrap: 'break-word',
    maxWidth: '60%'
  },
  divider: { height: 1, background: '#333', margin: '8px 0' },
  actions: { display: 'flex', gap: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 12, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
};