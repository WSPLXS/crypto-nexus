import React, { useState, useEffect } from 'react';
import { X, Copy, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { currencies } from '../data/currencies';
import { getLevelInfo, getGlobalMultiplier } from '../data/levels';
import type { OwnedCurrency } from '../types';

interface ReferralProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
}

interface Invitee {
  id: number;
  nickname: string;
  owned_currencies: OwnedCurrency[];
  max_balance: number;
}

export const Referral: React.FC<ReferralProps> = ({ isOpen, onClose, currentUserId }) => {
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const referralLink = `${window.location.origin}/?ref=${currentUserId}`;

  useEffect(() => {
    if (isOpen) fetchInvitees();
  }, [isOpen]);

  const fetchInvitees = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('id, nickname, owned_currencies, max_balance')
        .eq('referrer_id', currentUserId)
        .order('created_at', { ascending: false });
      
      setInvitees((data as Invitee[]) || []);
    } catch (err) {
      console.error('Ошибка загрузки рефералов:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateIncomePerMin = (invitee: Invitee) => {
    if (!invitee.owned_currencies?.length) return 0;
    const tier = getLevelInfo(invitee.max_balance || 0).tier;
    const globalMult = getGlobalMultiplier(tier);
    
    return invitee.owned_currencies.reduce((total, owned) => {
      const c = currencies.find(cur => cur.id === owned.currencyId);
      return total + (c ? c.incomePerSecond * owned.amount * globalMult * 60 : 0);
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🤝 Реферальная система</h2>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        </div>

        <div style={styles.statsBox}>
          <Users size={20} color="#22c55e" />
          <span style={styles.statsText}>Приглашено: <b>{invitees.length}</b> чел.</span>
        </div>

        <div style={styles.linkBox}>
          <input readOnly value={referralLink} style={styles.linkInput} />
          <button onClick={copyLink} style={styles.copyBtn}>
            {copied ? '✓ Скопировано' : <Copy size={18} />}
          </button>
        </div>

        <div style={styles.infoText}>
          Приглашённый должен ввести ник и потратить <b>$50</b>, чтобы ты получил бонус <b>$1000</b> 💰
        </div>

        <div style={styles.listContainer}>
          <h3 style={styles.listTitle}>Твоя команда:</h3>
          {loading ? (
            <div style={styles.loading}>Загрузка...</div>
          ) : invitees.length === 0 ? (
            <div style={styles.empty}>Пока никого не приглашено</div>
          ) : (
            invitees.map(inv => {
              const incomeMin = calculateIncomePerMin(inv);
              return (
                <div key={inv.id} style={styles.inviteeCard}>
                  <div style={styles.inviteeName}>{inv.nickname}</div>
                  {incomeMin > 0 && (
                    <div style={styles.incomeText}>+${incomeMin.toFixed(2)}/мин</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' },
  modal: { background: '#141414', borderRadius: 20, padding: 20, width: '90%', maxWidth: 400, maxHeight: '80vh', border: '1px solid rgba(156,163,175,0.1)', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#e5e5e5', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  statsBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', padding: '10px 14px', borderRadius: 12, marginBottom: 12, border: '1px solid rgba(34,197,94,0.2)' },
  statsText: { fontSize: 14, color: '#e5e5e5' },
  linkBox: { display: 'flex', gap: 8, marginBottom: 12 },
  linkInput: { flex: 1, background: '#0a0a0a', border: '1px solid rgba(156,163,175,0.2)', borderRadius: 10, padding: '10px 12px', color: '#9ca3af', fontSize: 12, outline: 'none' },
  copyBtn: { background: '#262626', border: '1px solid rgba(156,163,175,0.2)', borderRadius: 10, padding: '0 14px', cursor: 'pointer', color: '#e5e5e5', display: 'flex', alignItems: 'center' },
  infoText: { fontSize: 12, color: '#737373', marginBottom: 16, lineHeight: 1.4, background: 'rgba(38,38,38,0.4)', padding: 10, borderRadius: 10 },
  listContainer: { maxHeight: 200, overflowY: 'auto' },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#a3a3a3', marginBottom: 8 },
  loading: { textAlign: 'center', color: '#737373', padding: 20 },
  empty: { textAlign: 'center', color: '#525252', padding: 20, fontSize: 13 },
  inviteeCard: { background: 'rgba(20,20,20,0.6)', borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: '1px solid rgba(156,163,175,0.1)' },
  inviteeName: { fontSize: 14, fontWeight: '500', color: '#e5e5e5' },
  incomeText: { fontSize: 11, color: '#22c55e', marginTop: 2 }
};