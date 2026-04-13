import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Repeat, TrendingUp, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BankModalProps {
  isOpen: boolean; onClose: () => void; userId: number; balance: number; rubBalance: number;
  bankUsd: number; bankRub: number; cryptoHoldings: any; cryptoRates: any;
  onBalanceUpdate: (usd: number, rub: number) => void;
  onBankUpdate: (usd: number, rub: number) => void;
  onCryptoUpdate: (holdings: any) => void;
}

export const BankModal: React.FC<BankModalProps> = ({ isOpen, onClose, userId, balance, rubBalance, bankUsd, bankRub, cryptoHoldings, cryptoRates, onBalanceUpdate, onBankUpdate, onCryptoUpdate }) => {
  if (!isOpen) return null;
  const [tab, setTab] = useState<'account' | 'transfer' | 'exchange' | 'crypto'>('account');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

  const handleTransfer = async (toId: number, usd: number, rub: number) => {
    setLoading(true);
    try {
      const newBalUsd = balance - usd; const newBalRub = rubBalance - rub;
      if (newBalUsd < 0 || newBalRub < 0) throw new Error('Недостаточно средств');
      
      await supabase.from('users').update({ balance: newBalUsd, rub_balance: newBalRub }).eq('id', userId);
      const { data: target } = await supabase.from('users').select('balance, rub_balance').eq('id', toId).single();
      await supabase.from('users').update({ balance: (target?.balance || 0) + usd, rub_balance: (target?.rub_balance || 0) + rub }).eq('id', toId);
      await supabase.from('transactions').insert({ sender_id: userId, receiver_id: toId, amount: usd + rub, currency: 'MIX' });
      
      onBalanceUpdate(newBalUsd, newBalRub);
      alert('✅ Перевод выполнен');
      setAmount('');
    } catch (e: any) { alert('❌ ' + e.message); } finally { setLoading(false); }
  };

  const handleCryptoExchange = async (currency: string, amountCrypto: number, direction: 'sell' | 'buy') => {
    setLoading(true);
    try {
      const rate = cryptoRates[currency];
      if (!rate) throw new Error('Курс не найден');
      const totalRub = amountCrypto * rate.rate_rub;
      const totalUsd = amountCrypto * rate.rate_usd;

      if (direction === 'sell') {
        const current = cryptoHoldings[currency] || 0;
        if (current < amountCrypto) throw new Error('Недостаточно крипты');
        await supabase.from('users').update({ rub_balance: rubBalance + totalRub, balance: balance + totalUsd, crypto_holdings: {...cryptoHoldings, [currency]: current - amountCrypto} }).eq('id', userId);
        onBalanceUpdate(balance + totalUsd, rubBalance + totalRub);
        onCryptoUpdate({...cryptoHoldings, [currency]: current - amountCrypto});
      } else {
        if (rubBalance < totalRub) throw new Error('Недостаточно рублей');
        await supabase.from('users').update({ rub_balance: rubBalance - totalRub, crypto_holdings: {...cryptoHoldings, [currency]: (cryptoHoldings[currency] || 0) + amountCrypto} }).eq('id', userId);
        onBalanceUpdate(balance, rubBalance - totalRub);
        onCryptoUpdate({...cryptoHoldings, [currency]: (cryptoHoldings[currency] || 0) + amountCrypto});
      }
      alert('✅ Обмен выполнен');
      setAmount('');
    } catch (e: any) { alert('❌ ' + e.message); } finally { setLoading(false); }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <div style={styles.header}><Wallet size={24} color="#3b82f6" /><h2 style={styles.title}>Т-Банк</h2></div>
        
        <div style={styles.tabs}>
          {['account', 'transfer', 'exchange', 'crypto'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} style={{...styles.tab, ...(tab === t ? styles.tabActive : {})}}>{t === 'account' ? 'Счета' : t === 'transfer' ? 'Переводы' : t === 'exchange' ? 'Валюта' : 'Крипта'}</button>
          ))}
        </div>

        {tab === 'account' && (
          <div style={styles.content}>
            <div style={styles.card}><span style={styles.cardLabel}>Основной счет ($)</span><span style={styles.cardValue}>${fmt(bankUsd)}</span></div>
            <div style={styles.card}><span style={styles.cardLabel}>Основной счет (₽)</span><span style={styles.cardValue}>₽{fmt(bankRub)}</span></div>
            <div style={styles.card}><span style={styles.cardLabel}>Кошелек ($)</span><span style={styles.cardValue}>${fmt(balance)}</span></div>
            <div style={styles.card}><span style={styles.cardLabel}>Кошелек (₽)</span><span style={styles.cardValue}>₽{fmt(rubBalance)}</span></div>
          </div>
        )}

        {tab === 'transfer' && (
          <div style={styles.content}>
            <input style={styles.input} placeholder="ID получателя" type="number" id="targetId" />
            <input style={styles.input} placeholder="Сумма USD" type="number" id="usdAmt" />
            <input style={styles.input} placeholder="Сумма RUB" type="number" id="rubAmt" />
            <button onClick={() => handleTransfer(parseInt((document.getElementById('targetId') as HTMLInputElement).value), parseFloat((document.getElementById('usdAmt') as HTMLInputElement).value) || 0, parseFloat((document.getElementById('rubAmt') as HTMLInputElement).value) || 0)} disabled={loading} style={styles.btn}>Перевести</button>
          </div>
        )}

        {tab === 'exchange' && (
          <div style={styles.content}>
            <p style={{color:'#737373', fontSize:12, marginBottom:8}}>Курс: 1$ = 95₽ (фикс)</p>
            <input style={styles.input} placeholder="Сумма USD" type="number" id="exUsd" />
            <button onClick={() => { const usd = parseFloat((document.getElementById('exUsd') as HTMLInputElement).value) || 0; const rub = usd * 95; onBalanceUpdate(balance - usd, rubBalance + rub); onBankUpdate(bankUsd, bankRub); alert(`✅ Обменяно ${usd}$ на ${rub}₽`); }} style={styles.btn}>Обменять $ на ₽</button>
          </div>
        )}

        {tab === 'crypto' && (
          <div style={styles.content}>
            <h3 style={{color:'#fff', fontSize:16, marginBottom:12}}>Крипто-портфель</h3>
            {Object.entries(cryptoHoldings).map(([curr]) => (
              <div key={curr} style={styles.cryptoRow}>
                <div><span style={{fontWeight:'bold', color:'#fff'}}>{curr}</span><span style={{color:'#737373', fontSize:12, marginLeft:8}}>Курс: {cryptoRates[curr]?.rate_rub}₽</span></div>
                <div style={{display:'flex', gap:8}}>
                  <button onClick={() => handleCryptoExchange(curr, parseFloat(prompt('Сколько продать?') || '0'), 'sell')} style={styles.btnSmall}>Продать</button>
                  <button onClick={() => handleCryptoExchange(curr, parseFloat(prompt('Сколько купить?') || '0'), 'buy')} style={styles.btnSmall}>Купить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: any = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: '#141414', border: '1px solid #3b82f6', borderRadius: 24, padding: 20, width: '90%', maxWidth: 360, position: 'relative' },
  closeBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', margin: 0 },
  tabs: { display: 'flex', background: '#1a1a1a', borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'transparent', color: '#737373', fontWeight: '600', cursor: 'pointer', fontSize: 13 },
  tabActive: { background: '#3b82f6', color: '#fff' },
  content: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#1a1a1a', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#737373', fontSize: 13 },
  cardValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  input: { width: '100%', padding: '12px', borderRadius: 12, background: '#0a0a0a', border: '1px solid #404040', color: 'white', boxSizing: 'border-box', outline: 'none', fontSize: 16 },
  btn: { width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' },
  cryptoRow: { background: '#1a1a1a', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnSmall: { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', fontSize: 12, cursor: 'pointer' }
};