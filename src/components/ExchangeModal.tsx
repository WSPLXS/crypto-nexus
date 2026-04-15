import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';

const EXCHANGE_RATE = 90.0; // 1 USD = 90 RUB

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  usdBalance: number;
  rubBalance: number;
  onExchange: (usdChange: number, rubChange: number) => void;
}

export const ExchangeModal: React.FC<ExchangeModalProps> = ({
  isOpen, onClose, usdBalance, rubBalance, onExchange
}) => {
  const [direction, setDirection] = useState<'usd_to_rub' | 'rub_to_usd'>('usd_to_rub');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const amountNum = parseFloat(amount) || 0;
  const rate = EXCHANGE_RATE;
  const receivedAmount = direction === 'usd_to_rub' ? amountNum * rate : amountNum / rate;

  const handleExchange = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    if (amountNum <= 0 || isNaN(amountNum)) {
      setStatus('error');
      setMessage('Введите корректную сумму');
      setLoading(false);
      return;
    }

    if (direction === 'usd_to_rub' && amountNum > usdBalance) {
      setStatus('error');
      setMessage('Недостаточно долларов');
      setLoading(false);
      return;
    }
    if (direction === 'rub_to_usd' && amountNum > rubBalance) {
      setStatus('error');
      setMessage('Недостаточно рублей');
      setLoading(false);
      return;
    }

    try {
      await new Promise(res => setTimeout(res, 600));
      
      if (direction === 'usd_to_rub') {
        onExchange(-amountNum, receivedAmount);
      } else {
        onExchange(receivedAmount, -amountNum);
      }
      
      setStatus('success');
      setMessage(`Обменяно ${amountNum} ${direction === 'usd_to_rub' ? '$' : '₽'} на ${receivedAmount.toFixed(2)} ${direction === 'usd_to_rub' ? '₽' : '$'}`);
      setAmount('');
      
      setTimeout(() => {
        onClose();
        setTimeout(() => setStatus('idle'), 500);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setMessage('Ошибка при обмене. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <h2 style={styles.modalTitle}>💱 Обмен валют</h2>

        {status === 'idle' || status === 'error' ? (
          <>
            <div style={styles.rateCard}>
              <span style={styles.rateLabel}>Курс:</span>
              <span style={styles.rateValue}>1 $ = {rate} ₽</span>
            </div>

            <div style={styles.directionToggle}>
              <button onClick={() => setDirection('usd_to_rub')} style={{...styles.toggleBtn, ...(direction === 'usd_to_rub' ? styles.toggleActive : {})}}>$ → ₽</button>
              <button onClick={() => setDirection('rub_to_usd')} style={{...styles.toggleBtn, ...(direction === 'rub_to_usd' ? styles.toggleActive : {})}}>₽ → $</button>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Сумма ({direction === 'usd_to_rub' ? '$' : '₽'}):</label>
              <input style={styles.input} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={loading} />
              <p style={styles.balanceHint}>Баланс: {direction === 'usd_to_rub' ? `$${usdBalance.toFixed(2)}` : `₽${rubBalance.toFixed(2)}`}</p>
            </div>

            {amountNum > 0 && (
              <div style={styles.previewBox}>
                <ArrowRightLeft size={16} color="#a3a3a3" />
                <span>Получите: <b>{receivedAmount.toFixed(2)} {direction === 'usd_to_rub' ? '₽' : '$'}</b></span>
              </div>
            )}

            {status === 'error' && (
              <div style={styles.errorBox}><AlertCircle size={16} style={{marginRight: 8}} /> {message}</div>
            )}

            <button onClick={handleExchange} style={{...styles.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}} disabled={loading}>
              {loading ? 'Обработка...' : 'Подтвердить обмен'}
            </button>
          </>
        ) : (
          <div style={styles.successBox}>
            <div style={{fontSize: 48, marginBottom: 12}}>✅</div>
            <h3 style={{color: '#22c55e', marginBottom: 8}}>Обмен выполнен!</h3>
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
  rateCard: { background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel: { color: '#9ca3af', fontSize: 13 },
  rateValue: { color: '#3b82f6', fontWeight: 'bold', fontSize: 16 },
  directionToggle: { display: 'flex', background: '#262626', borderRadius: 12, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'transparent', color: '#737373', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  toggleActive: { background: '#3b82f6', color: 'white', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)' },
  inputGroup: { marginBottom: 16 },
  label: { display: 'block', color: '#a3a3a3', fontSize: 13, marginBottom: 8 },
  input: { width: '100%', padding: '12px', borderRadius: 12, background: '#0a0a0a', border: '1px solid #404040', color: 'white', boxSizing: 'border-box', outline: 'none', fontSize: 18, fontWeight: 'bold' },
  balanceHint: { color: '#737373', fontSize: 12, marginTop: 8, textAlign: 'right' },
  previewBox: { background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#4ade80', fontSize: 14 },
  errorBox: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  successBox: { textAlign: 'center', padding: '20px 0' }
};