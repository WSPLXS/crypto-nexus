import React, { useState } from 'react';
import { X, Send } from 'lucide-react'; // ✅ Убрали ArrowRightLeft
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
  isOpen,
  onClose,
  currentUserId,
  usdBalance,
  rubBalance,
  onRefreshBalance
}) => {
  const [targetNickname, setTargetNickname] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'usd' | 'rub'>('usd');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const currentBalance = currency === 'usd' ? usdBalance : rubBalance;
  const currencySymbol = currency === 'usd' ? '$' : '₽';

  const handleTransfer = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    const amountNum = parseFloat(amount);

    // 1. Валидация
    if (!targetNickname.trim()) {
      setStatus('error');
      setMessage('Введите никнейм получателя');
      setLoading(false);
      return;
    }

    if (!amountNum || amountNum <= 0) {
      setStatus('error');
      setMessage('Введите корректную сумму');
      setLoading(false);
      return;
    }

    if (amountNum > currentBalance) {
      setStatus('error');
      setMessage(`Недостаточно ${currencySymbol} на балансе`);
      setLoading(false);
      return;
    }

    try {
      // 2. Ищем пользователя по нику
      // ✅ ИСПРАВЛЕНИЕ: добавлено data: перед receiver
      const { data: receiver, error: findError } = await supabase
        .from('users')
        .select('id, nickname, balance, rub_balance')
        .eq('nickname', targetNickname.trim())
        .single();

      if (findError || !receiver) {
        setStatus('error');
        setMessage('Игрок с таким ником не найден');
        setLoading(false);
        return;
      }

      if (receiver.id === currentUserId) {
        setStatus('error');
        setMessage('Нельзя переводить самому себе');
        setLoading(false);
        return;
      }

      // 3. Выполняем перевод
      if (currency === 'usd') {
        // Перевод долларов
        const { error: updateReceiverError } = await supabase
          .from('users')
          .update({ balance: (receiver.balance || 0) + amountNum })
          .eq('id', receiver.id);

        if (updateReceiverError) throw updateReceiverError;

        const { error: updateSenderError } = await supabase
          .from('users')
          .update({ balance: usdBalance - amountNum })
          .eq('id', currentUserId);

        if (updateSenderError) throw updateSenderError;
      } else {
        // Перевод рублей
        const { error: updateReceiverError } = await supabase
          .from('users')
          .update({ rub_balance: (receiver.rub_balance || 0) + amountNum })
          .eq('id', receiver.id);

        if (updateReceiverError) throw updateReceiverError;

        const { error: updateSenderError } = await supabase
          .from('users')
          .update({ rub_balance: rubBalance - amountNum })
          .eq('id', currentUserId);

        if (updateSenderError) throw updateSenderError;
      }

      // 4. Успех
      setStatus('success');
      setMessage(`Успешно переведено ${amountNum}${currencySymbol} игроку ${receiver.nickname}`);
      onRefreshBalance();
      
      setTargetNickname('');
      setAmount('');
      setCurrency('usd');
      
      setTimeout(() => {
        onClose();
        setTimeout(() => setStatus('idle'), 500);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage('Ошибка при переводе. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        
        <h2 style={styles.modalTitle}>💸 Перевод средств</h2>

        {status === 'idle' || status === 'error' ? (
          <>
            <div style={styles.currencyToggle}>
              <button 
                onClick={() => setCurrency('usd')} 
                style={{...styles.toggleBtn, ...(currency === 'usd' ? styles.toggleActive : {})}}
              >
                $ USD
              </button>
              <button 
                onClick={() => setCurrency('rub')} 
                style={{...styles.toggleBtn, ...(currency === 'rub' ? styles.toggleActive : {})}}
              >
                ₽ RUB
              </button>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Никнейм получателя:</label>
              <input 
                style={styles.input} 
                placeholder="Например: Player123" 
                value={targetNickname}
                onChange={(e) => setTargetNickname(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Сумма перевода ({currencySymbol}):</label>
              <input 
                style={{...styles.input, fontSize: 18, fontWeight: 'bold', color: currency === 'usd' ? '#22c55e' : '#a855f7'}} 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
              <p style={styles.balanceHint}>Ваш баланс: {currentBalance.toFixed(2)}{currencySymbol}</p>
            </div>

            {status === 'error' && (
              <div style={styles.errorBox}>
                ⚠️ {message}
              </div>
            )}

            <button 
              onClick={handleTransfer} 
              style={{...styles.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', background: currency === 'usd' ? '#22c55e' : '#a855f7'}}
              disabled={loading}
            >
              {loading ? 'Обработка...' : `Отправить ${currencySymbol}`}
              {!loading && <Send size={18} style={{marginLeft: 8}} />}
            </button>
          </>
        ) : (
          <div style={styles.successBox}>
            <div style={{fontSize: 48, marginBottom: 12}}>✅</div>
            <h3 style={{color: '#22c55e', marginBottom: 8}}>Перевод выполнен!</h3>
            <p style={{color: '#9ca3af'}}>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  modal: { background: '#141414', border: '1px solid rgba(156,163,175,0.15)', borderRadius: 20, padding: 24, width: '90%', maxWidth: 360, position: 'relative' },
  closeBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#e5e5e5', marginBottom: 20, textAlign: 'center' },
  currencyToggle: { display: 'flex', background: '#262626', borderRadius: 12, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'transparent', color: '#737373', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  toggleActive: { background: '#3b82f6', color: 'white', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)' },
  inputGroup: { marginBottom: 16 },
  label: { display: 'block', color: '#a3a3a3', fontSize: 13, marginBottom: 8 },
  input: { width: '100%', padding: '12px', borderRadius: 12, background: '#262626', border: '1px solid #404040', color: 'white', boxSizing: 'border-box', outline: 'none' },
  balanceHint: { color: '#737373', fontSize: 12, marginTop: 8, textAlign: 'right' },
  btnPrimary: { width: '100%', padding: '14px', borderRadius: 12, border: 'none', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8, transition: 'background 0.2s' },
  errorBox: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13, textAlign: 'center' },
  successBox: { textAlign: 'center', padding: '20px 0' }
};