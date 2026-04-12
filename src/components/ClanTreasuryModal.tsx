import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClanTreasuryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clan: any;
  myRole: number; // 4 = лидер
  onRefreshClan: () => void;
}

export const ClanTreasuryModal: React.FC<ClanTreasuryModalProps> = ({ isOpen, onClose, clan, myRole, onRefreshClan }) => {
  const [currency, setCurrency] = useState<'usd' | 'rub'>('usd');
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !clan) return null;

  const symbol = currency === 'usd' ? '$' : '₽';

  const handleAction = async () => {
    setLoading(true);
    const num = parseFloat(amount);
    if (!num || num <= 0) { setLoading(false); return; }

    try {
      const col = currency === 'usd' ? 'treasury_usd' : 'treasury_rub';
      const val = action === 'deposit' ? num : -num;
      
      const { error } = await supabase
        .from('clans')
        .update({ [col]: (clan[col] || 0) + val })
        .eq('id', clan.id);
        
      if (error) throw error;
      setAmount('');
      onRefreshClan();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <h2 style={styles.modalTitle}>🏦 Казна клана</h2>
        
        <div style={styles.balancesRow}>
          <div style={styles.balanceCard}><span style={styles.balLabel}>USD</span><span style={styles.balVal}>${(clan.treasury_usd || 0).toFixed(2)}</span></div>
          <div style={styles.balanceCard}><span style={styles.balLabel}>RUB</span><span style={styles.balVal}>₽{(clan.treasury_rub || 0).toFixed(2)}</span></div>
        </div>

        <div style={styles.toggleGroup}>
          <button onClick={() => setCurrency('usd')} style={{...styles.toggle, active: currency==='usd'}}>$ USD</button>
          <button onClick={() => setCurrency('rub')} style={{...styles.toggle, active: currency==='rub'}}>₽ RUB</button>
        </div>

        <div style={styles.toggleGroup}>
          <button onClick={() => setAction('deposit')} style={{...styles.toggle, active: action==='deposit'}}><ArrowUpRight size={16}/> Пополнить</button>
          {myRole === 4 && <button onClick={() => setAction('withdraw')} style={{...styles.toggle, active: action==='withdraw'}}><ArrowDownLeft size={16}/> Взять</button>}
        </div>

        <input style={styles.input} type="number" placeholder={`Сумма (${symbol})`} value={amount} onChange={e => setAmount(e.target.value)} disabled={loading} />
        
        <button onClick={handleAction} style={{...styles.btn, opacity: loading?0.7:1}} disabled={loading}>
          {loading ? 'Обработка...' : action==='deposit' ? `Пополнить ${symbol}` : `Взять ${symbol}`}
        </button>

        {myRole === 4 && (
          <button onClick={() => alert('Магазин улучшений скоро!')} style={styles.btnUpgrade}>
            <Package size={18} /> Купить улучшение (скоро)
          </button>
        )}
      </div>
    </div>
  );
};

const styles: any = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(8px)' },
  modal: { background:'#141414', border:'1px solid rgba(156,163,175,0.15)', borderRadius:20, padding:24, width:'90%', maxWidth:380, position:'relative' },
  closeBtn: { position:'absolute', top:16, right:16, background:'none', border:'none', cursor:'pointer' },
  modalTitle: { fontSize:20, fontWeight:'bold', color:'#e5e5e5', marginBottom:20, textAlign:'center' },
  balancesRow: { display:'flex', gap:12, marginBottom:20 },
  balanceCard: { flex:1, background:'#1e1e1e', padding:12, borderRadius:12, textAlign:'center' },
  balLabel: { display:'block', fontSize:12, color:'#737373', marginBottom:4 },
  balVal: { fontSize:16, fontWeight:'bold', color:'#fff' },
  toggleGroup: { display:'flex', background:'#262626', borderRadius:12, padding:4, marginBottom:12 },
  toggle: { flex:1, padding:'8px 0', borderRadius:10, border:'none', background:'transparent', color:'#737373', fontWeight:'600', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:4 },
  input: { width:'100%', padding:'12px', borderRadius:12, background:'#0a0a0a', border:'1px solid #404040', color:'white', boxSizing:'border-box', outline:'none', marginBottom:12 },
  btn: { width:'100%', padding:'14px', borderRadius:12, border:'none', background:'#22c55e', color:'white', fontWeight:'bold', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  btnUpgrade: { width:'100%', padding:'14px', borderRadius:12, border:'1px solid #404040', background:'transparent', color:'#a3a3a3', fontWeight:'bold', fontSize:14, cursor:'pointer', marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }
};