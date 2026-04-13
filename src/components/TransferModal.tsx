import React, { useState, useEffect } from 'react';
import { X, Send, CircleDollarSign, DollarSign, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  usdBalance: number;
  rubBalance: number;
  onTransferSuccess: (newUsd: number, newRub: number) => void; // 🔥 НОВЫЙ ПРОПС
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen, onClose, currentUserId, usdBalance, rubBalance, onTransferSuccess
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'usd' | 'rub'>('usd');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setAmount('');
      setCurrency('usd');
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!selectedUser) return alert('Выберите получателя из списка');
    
    const num = parseFloat(amount);
    const target = selectedUser.id;

    if (!num || num <= 0) return alert('Введите сумму больше 0');
    
    const currentBalance = currency === 'usd' ? usdBalance : rubBalance;
    const symbol = currency === 'usd' ? '$' : '₽';
    
    if (num > currentBalance) {
      alert(`Недостаточно средств! Доступно: ${currentBalance.toFixed(2)}${symbol}`);
      return;
    }

    setLoading(true);
    try {
      const colName = currency === 'usd' ? 'balance' : 'rub_balance';
      const dbCurrency = currency === 'usd' ? 'USD' : 'RUB';

      // 1. Снимаем с отправителя
      const { error: senderError } = await supabase
        .from('users')
        .update({ [colName]: currentBalance - num })
        .eq('id', currentUserId);
      if (senderError) throw senderError;

      // 2. Находим получателя и начисляем
      const { data: receiver, error: receiverError } = await supabase
        .from('users')
        .select('id, balance, rub_balance')
        .eq('id', target)
        .single();

      if (receiverError || !receiver) throw new Error('Пользователь не найден!');

      const receiverCurrent = receiver[colName] || 0;
      const { error: updateError } = await supabase
        .from('users')
        .update({ [colName]: receiverCurrent + num })
        .eq('id', target);
      if (updateError) throw updateError;

      // 3. Логируем перевод
      await supabase.from('transactions').insert({
        sender_id: currentUserId,
        receiver_id: target,
        amount: num,
        currency: dbCurrency
      });

      alert(`✅ Успешно переведено ${num}${symbol} игроку ${selectedUser.nickname || target}!`);
      
      // 🔥 ВЫЗЫВАЕМ КАЛБЭК С НОВЫМИ БАЛАНСАМИ
      const newUsd = currency === 'usd' ? usdBalance - num : usdBalance;
      const newRub = currency === 'rub' ? rubBalance - num : rubBalance;
      onTransferSuccess(newUsd, newRub);
      
      onClose();
    } catch (err: any) {
      console.error('Transfer error:', err);
      alert(`❌ Ошибка: ${err.message || 'Не удалось выполнить перевод'}`);
    } finally {
      setLoading(false);
    }
  };

  // Поиск пользователя
  useEffect(() => {
    const searchUser = async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, nickname, balance, rub_balance')
          .ilike('nickname', `%${searchQuery}%`)
          .neq('id', currentUserId)
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUser, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUserId]);

  if (!isOpen) return null;

  const currentBalance = currency === 'usd' ? usdBalance : rubBalance;
  const symbol = currency === 'usd' ? '$' : '₽';

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
          Никнейм получателя:
          <div style={{position: 'relative'}}>
            <Search size={18} color="#737373" style={{position: 'absolute', left: 12, top: 12}} />
            <input
              style={{...styles.input, paddingLeft: 40}}
              type="text"
              placeholder="Введите никнейм..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSelectedUser(null);
              }}
              disabled={loading}
            />
          </div>
        </label>

        {searching && <div style={styles.searching}>🔍 Поиск...</div>}
        
        {searchResults.length > 0 && !selectedUser && (
          <div style={styles.searchResults}>
            {searchResults.map(user => (
              <div
                key={user.id}
                style={styles.searchItem}
                onClick={() => {
                  setSelectedUser(user);
                  setSearchResults([]);
                  setSearchQuery(user.nickname || `Player${String(user.id).slice(-4)}`);
                }}
              >
                <div style={styles.searchAvatar}>{(user.nickname || '?')[0].toUpperCase()}</div>
                <div style={{flex: 1}}>
                  <div style={styles.searchName}>{user.nickname || 'Player'}</div>
                  <div style={styles.searchBalance}>
                    ${(user.balance || 0).toFixed(0)} | ₽{(user.rub_balance || 0).toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedUser && (
          <div style={styles.selectedUser}>
            <div style={styles.searchAvatar}>{(selectedUser.nickname || '?')[0].toUpperCase()}</div>
            <div style={{flex: 1}}>
              <div style={styles.searchName}>{selectedUser.nickname || 'Player'}</div>
            </div>
            <button
              onClick={() => {
                setSelectedUser(null);
                setSearchQuery('');
              }}
              style={styles.clearBtn}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <label style={styles.label}>
          Сумма ({symbol}):
          <input
            style={styles.input}
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={loading || !selectedUser}
          />
        </label>

        <button
          onClick={handleSend}
          disabled={loading || !amount || !selectedUser}
          style={{
            ...styles.btn,
            opacity: loading || !amount || !selectedUser ? 0.5 : 1,
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
  btn: { width: '100%', padding: '14px', borderRadius: 12, border: 'none', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8, transition: 'opacity 0.2s' },
  searching: { textAlign: 'center', color: '#737373', padding: '8px 0', fontSize: 13 },
  searchResults: { background: '#1a1a1a', borderRadius: 12, overflow: 'hidden', marginBottom: 12, border: '1px solid #404040' },
  searchItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px', cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid #262626' },
  searchAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: 'white' },
  searchName: { color: '#e5e5e5', fontSize: 14, fontWeight: '500' },
  searchBalance: { color: '#737373', fontSize: 12, marginTop: 2 },
  selectedUser: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#1a1a1a', borderRadius: 12, marginBottom: 12, border: '1px solid #22c55e' },
  clearBtn: { background: '#ef4444', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }
};