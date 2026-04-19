import React, { useState, useEffect } from 'react';
import { X, Send, CircleDollarSign, DollarSign, Search, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  usdBalance: number;
  rubBalance: number;
  onTransferSuccess: (newUsd: number, newRub: number) => void;
  onSaveProgress?: () => void;
}

// 🔥 ФУНКЦИЯ ЭКРАНИРОВАНИЯ СПЕЦСИМВОЛОВ ДЛЯ ILIKE
const escapeIlike = (str: string) => {
  return str.replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/\\/g, '\\\\');
};

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen, onClose, currentUserId, usdBalance, rubBalance, onTransferSuccess, onSaveProgress
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'usd' | 'rub'>('usd');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false); // 🔥 ПОКАЗ ВЫПАДАЮЩЕГО СПИСКА

  // Сброс при открытии
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setAmount('');
      setCurrency('usd');
      setShowSuggestions(false);
    }
  }, [isOpen]);

  // 🔥 ПОИСК С АВТОДОПОЛНЕНИЕМ (срабатывает при вводе)
  useEffect(() => {
    const searchUser = async () => {
      const trimmed = searchQuery.trim();
      
      // 🔥 Ищем даже с 1 символа!
      if (trimmed.length < 1) {
        setSearchResults([]);
        setShowSuggestions(false);
        return;
      }

      setSearching(true);
      
      try {
        const escaped = escapeIlike(trimmed);
        
        // 🔥 Ищем ТОЛЬКО по nickname (не по телеграм-данным!)
        const { data, error } = await supabase
          .from('users')
          .select('id, nickname, balance, rub_balance')
          .ilike('nickname', `%${escaped}%`)
          .neq('id', currentUserId)
          .limit(10); // 🔥 Показываем до 10 результатов

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSearchResults(data);
          setShowSuggestions(true); // 🔥 Показываем выпадающий список
        } else {
          setSearchResults([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
        setShowSuggestions(false);
      } finally {
        setSearching(false);
      }
    };

    // Debounce 200ms для плавности
    const timeoutId = setTimeout(searchUser, 200);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUserId]);

  // 🔥 ЗАКРЫТЬ ПОДСКАЗКИ ПРИ КЛИКЕ ВНЕ
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSuggestions]);

  const handleSend = async () => {
    if (!selectedUser) {
      // 🔥 Если пользователь не выбран из списка — ищем точное совпадение
      const trimmed = searchQuery.trim();
      if (!trimmed) return alert('Введите никнейм получателя');
      
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, nickname')
          .eq('nickname', trimmed) // 🔥 ТОЧНОЕ совпадение (без ilike)
          .neq('id', currentUserId)
          .single();
          
        if (error || !data) {
          return alert('Пользователь не найден! Выберите из подсказок.');
        }
        setSelectedUser(data);
      } finally {
        setSearching(false);
      }
    }

    if (selectedUser.id === currentUserId) return alert('Нельзя перевести деньги самому себе!');
    
    const num = parseFloat(amount);
    if (!num || num <= 0 || isNaN(num)) return alert('Введите корректную сумму больше 0');
    
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

      // 2. Начисляем получателю
      const { data: receiver, error: receiverError } = await supabase
        .from('users')
        .select(`id, ${colName}`)
        .eq('id', selectedUser.id)
        .single();

      if (receiverError || !receiver) throw new Error('Получатель не найден!');

      const receiverCurrent = (receiver as Record<string, any>)?.[colName] || 0;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ [colName]: receiverCurrent + num })
        .eq('id', selectedUser.id);
      
      if (updateError) throw updateError;

      // 3. Логируем перевод
      await supabase.from('transactions').insert({
  sender_id: currentUserId,
  receiver_id: selectedUser.id,
  amount: num,
  currency: dbCurrency,
  status: 'completed'
});

      alert(`✅ Успешно переведено ${num}${symbol} игроку ${selectedUser.nickname}!`);
      
      const newUsd = currency === 'usd' ? usdBalance - num : usdBalance;
      const newRub = currency === 'rub' ? rubBalance - num : rubBalance;
      onTransferSuccess(newUsd, newRub);
      
      onSaveProgress?.();
      
      onClose();
    } catch (err: any) {
      console.error('Transfer error:', err);
      alert(`❌ Ошибка: ${err.message || 'Не удалось выполнить перевод'}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ВЫБОР ПОЛЬЗОВАТЕЛЯ ИЗ ПОДСКАЗОК
  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSearchQuery(user.nickname); // Заполняем поле никнеймом
    setShowSuggestions(false); // Скрываем подсказки
  };

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

        {/* 🔥 ПОЛЕ ПОИСКА С ПОДСКАЗКАМИ */}
        <label style={styles.label}>
          Никнейм получателя:
          <div style={{position: 'relative'}}>
            <Search size={18} color="#737373" style={{position: 'absolute', left: 12, top: 12, zIndex: 2}} />
            <input
              style={{...styles.input, paddingLeft: 40}}
              type="text"
              placeholder="Введите никнейм..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSelectedUser(null);
                setShowSuggestions(true);
              }}
              onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
              disabled={loading}
            />
            
            {/* 🔥 ВЫПАДАЮЩИЙ СПИСОК ПОДСКАЗОК */}
            {showSuggestions && searchResults.length > 0 && (
              <div style={styles.suggestionsList}>
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    style={styles.suggestionItem}
                    onClick={(e) => {
                      e.stopPropagation(); // Чтобы не закрылся при клике
                      handleSelectUser(user);
                    }}
                  >
                    <div style={styles.suggestionAvatar}>
                      {(user.nickname || '?')[0].toUpperCase()}
                    </div>
                    <div style={{flex: 1}}>
                      <div style={styles.suggestionName}>{user.nickname}</div>
                      <div style={styles.suggestionBalance}>
                        ${(user.balance || 0).toFixed(0)} | ₽{(user.rub_balance || 0).toFixed(0)}
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <div style={styles.selectedCheck}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {searching && searchResults.length === 0 && (
              <div style={styles.searching}>🔍 Поиск...</div>
            )}
            
            {!searching && searchQuery.trim().length >= 1 && searchResults.length === 0 && showSuggestions && (
              <div style={styles.noResults}>Никнейм не найден</div>
            )}
          </div>
        </label>

        {/* 🔥 ОТОБРАЖЕНИЕ ВЫБРАННОГО ПОЛЬЗОВАТЕЛЯ */}
        {selectedUser && (
          <div style={styles.selectedUser}>
            <div style={styles.searchAvatar}>{(selectedUser.nickname || '?')[0].toUpperCase()}</div>
            <div style={{flex: 1}}>
              <div style={styles.searchName}>{selectedUser.nickname}</div>
              <div style={styles.searchBalance}>
                ${(selectedUser.balance || 0).toFixed(0)} | ₽{(selectedUser.rub_balance || 0).toFixed(0)}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedUser(null);
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              style={styles.clearBtn}
              disabled={loading}
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
            disabled={loading}
            min="0.01"
            step="0.01"
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
  searching: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', color: '#737373', padding: '8px 12px', fontSize: 13, borderRadius: '0 0 12px 12px', border: '1px solid #404040', borderTop: 'none', zIndex: 10 },
  noResults: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', color: '#ef4444', padding: '8px 12px', fontSize: 13, borderRadius: '0 0 12px 12px', border: '1px solid #404040', borderTop: 'none', zIndex: 10 },
  
  // 🔥 СТИЛИ ДЛЯ ВЫПАДАЮЩЕГО СПИСКА
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#1a1a1a',
    borderRadius: '0 0 12px 12px',
    border: '1px solid #404040',
    borderTop: 'none',
    maxHeight: 200,
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    borderBottom: '1px solid #262626'
  },
  suggestionAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flexShrink: 0
  },
  suggestionName: { color: '#e5e5e5', fontSize: 14, fontWeight: '500' },
  suggestionBalance: { color: '#737373', fontSize: 12, marginTop: 2 },
  selectedCheck: {
    background: '#22c55e',
    color: 'white',
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 'bold'
  },
  
  selectedUser: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#1a1a1a', borderRadius: 12, marginBottom: 12, border: '1px solid #22c55e' },
  searchAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: 'white' },
  searchName: { color: '#e5e5e5', fontSize: 14, fontWeight: '500' },
  searchBalance: { color: '#737373', fontSize: 12, marginTop: 2 },
  clearBtn: { background: '#ef4444', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }
};