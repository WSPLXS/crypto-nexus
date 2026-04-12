import React, { useState } from 'react';
import { X, Send, CircleDollarSign, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  usdBalance: number;
  rubBalance: number;
  onRefreshBalance: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen, onClose, currentUserId, usdBalance, rubBalance, onRefreshBalance
}) => {
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'usd' | 'rub'>('usd');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentBalance = currency === 'usd' ? usdBalance : rubBalance;
  const symbol = currency === 'usd' ? '$' : '₽';
  const colName = currency === 'usd' ? 'balance' : 'rub_balance';
  const dbCurrency = currency === 'usd' ? 'USD' : 'RUB';

  const handleSend = async () => {
    const num = parseFloat(amount);
    const target = parseInt(targetId, 10);

    if (!target || isNaN(target)) return alert('Введите корректный ID получателя');
    if (target === currentUserId) return alert('Нельзя перевести деньги самому себе!');
    if (!num || num <= 0) return alert('Введите сумму больше 0');
    if (num > currentBalance) return alert(`Недостаточно средств! Доступно: ${currentBalance.toFixed(2)}${symbol}`);

    setLoading(true);
    try {
      // 1. Снимаем с отправителя
      const { error: senderError } = await supabase
        .from('users')
        .update({ [colName]: currentBalance - num })
        .eq('id', currentUserId);
      if (senderError) throw senderError;

      // 2. Находим получателя и начисляем
      const { data: receiverData, error: receiverError } = await supabase
        .from('users')
        .select('id, balance, rub_balance')
        .eq('id', target)
        .single();

      if (receiverError || !receiverData) throw new Error('Пользователь не найден! Проверьте ID.');

      const receiverCurrent = receiverData[colName] || 0;
      const { error: updateError } = await supabase
        .from('users')
        .update({ [colName]: receiverCurrent + num })
        .eq('id', target);
      if (updateError) throw updateError;

      // 3. Логируем перевод в историю
      await supabase.from('transactions').insert({
        sender_id: currentUserId,
        receiver_id: target,
        amount: num,
        currency: dbCurrency
      });

      alert(`✅ Успешно переведено ${num}${symbol} игроку ${target}!`);
      onRefreshBalance();
      setAmount('');
      setTargetId('');
      onClose();
    } catch (err: any) {
      console.error('Transfer error:', err);
      alert(`❌ Ошибка: ${err.message || 'Не удалось выполнить перевод'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <h2 style={styles.modalTitle}>💸 Перевод средств</h2>

        <div style={styles.currencyToggle}>
          <button
            onClick={() => setCurrency('usd')}
            style={{ ...styles.toggleBtn, ...(currency === 'usd' ? styles.toggleActive : {}) }}
          >
            <DollarSign size={16} /> USD
          </button>
          <button
            onClick={() => setCurrency('rub')}
            style={{ ...styles.toggleBtn, ...(currency === 'rub' ? styles.toggleActive : {}) }}
          >
            <CircleDollarSign size={16} /> RUB
          </button>
        </div>

        <p style={styles.balanceHint}>Ваш баланс: <b>{currentBalance.toFixed(2)}{symbol}</b></p>

        <label style={styles.label}>
          ID получателя:
          <input
            style={styles.input}
            type="number"
            placeholder="Например: 123456789"
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            disabled={loading}
          />
        </label>

        <label style={styles.label}>
          Сумма ({symbol}):
          <input
            style={styles.input}
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={loading}
          />
        </label>

        <button
          onClick={handleSend}
          disabled={loading || !amount || !targetId}
          style={{
            ...styles.btn,
            opacity: loading || !amount || !targetId ? 0.5 : 1,
            background: currency === 'usd' ? '#22c55e' : '#a855f7'
          }}
        >
          {loading ? '⏳ Отправка...' : <><Send size={18} style={{marginRight: 8}}/> Перевести {symbol}</>}
        </button>
      </div>
    </div>
  );
};

const styles: any = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  modal: { background: '#141414', border: '1px solid rgba(156,163,175,0.15)', borderRadius: 20, padding: 24, width: '90%', maxWidth: 380, position: 'relative' },
  closeBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#e5e5e5', marginBottom: 20, textAlign: 'center' },
  currencyToggle: { display: 'flex', background: '#262626', borderRadius: 12, padding: 4, marginBottom: 12 },
  toggleBtn: { flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'transparent', color: '#737373', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14 },
  toggleActive: { background: '#3b82f6', color: 'white', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)' },
  balanceHint: { color: '#a3a3a3', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, color: '#a3a3a3', fontSize: 13, marginBottom: 12 },
  input: { width: '100%', padding: '12px', borderRadius: 12, background: '#0a0a0a', border: '1px solid #404040', color: 'white', boxSizing: 'border-box', outline: 'none', fontSize: 16 },
  btn: { width: '100%', padding: '14px', borderRadius: 12, border: 'none', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8, transition: 'opacity 0.2s' }
};