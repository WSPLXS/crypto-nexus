import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowUpRight, ArrowDownLeft, Repeat, Wallet, MoreVertical, TrendingUp, Shield, CreditCard } from 'lucide-react';
import { CRYPTO_LIST, STAKING_CONFIG } from '../data/economy';
import { supabase } from '../lib/supabase';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userNickname: string;
  balance: number;
  rubBalance: number;
  bankUsd: number;
  bankRub: number;
  onBalanceUpdate: (usd: number, rub: number) => void;
  onBankUpdate: (usd: number, rub: number) => void;
}

export const BankModal: React.FC<BankModalProps> = ({
  isOpen, onClose, userId, userNickname, balance, rubBalance, bankUsd, bankRub,
  onBalanceUpdate, onBankUpdate
}) => {
  if (!isOpen) return null;

  const [screen, setScreen] = useState<'main' | 'operations' | 'transfer' | 'account' | 'exchange' | 'trade' | 'staking'>('main');
  const [cardSide, setCardSide] = useState<'rub' | 'usd'>('rub');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_LIST[0].id);
  const [tradeAmount, setTradeAmount] = useState('');
  const [stakeInput, setStakeInput] = useState('');

  // Загрузка транзакций
  useEffect(() => {
    if (isOpen && screen === 'operations') {
      loadTransactions();
    }
  }, [isOpen, screen]);

  // Живые цены крипты
  useEffect(() => {
    const initPrices: Record<string, number> = {};
    CRYPTO_LIST.forEach(c => initPrices[c.id] = c.basePrice);
    setLivePrices(initPrices);
    const interval = setInterval(() => {
      setLivePrices(prev => {
        const next = { ...prev };
        CRYPTO_LIST.forEach(c => {
          const change = 1 + (Math.random() * 0.04 - 0.02);
          next[c.id] = Math.max(c.basePrice * 0.5, next[c.id] * change);
        });
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTransactions = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) {
        setTransactions(data);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthTxs = data.filter(t => 
          t.sender_id === userId && 
          new Date(t.created_at) > monthAgo
        );
        const total = monthTxs.reduce((sum, t) => sum + t.amount, 0);
        setMonthlySpend(total);
      }
    } catch (err) {
      console.error('Load transactions error:', err);
    }
  };

  const fmt = (n: number, curr: string = '') => 
    `${n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}${curr ? ' ' + curr : ''}`;

  const handleTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) return alert('Введите сумму');
    if (!transferTarget.trim()) return alert('Введите ник получателя');
    if (amt > rubBalance) return alert('Недостаточно рублей');
    
    try {
      const { data: targetUser } = await supabase
        .from('users')
        .select('id, nickname, rub_balance')
        .ilike('nickname', transferTarget.trim())
        .neq('id', userId)
        .single();

      if (!targetUser) return alert('Пользователь не найден');

      await supabase.from('users').update({ rub_balance: rubBalance - amt }).eq('id', userId);
      await supabase.from('users').update({ rub_balance: (targetUser.rub_balance || 0) + amt }).eq('id', targetUser.id);
      await supabase.from('transactions').insert({
        sender_id: userId,
        receiver_id: targetUser.id,
        amount: amt,
        currency: 'RUB'
      });

      onBalanceUpdate(balance, rubBalance - amt);
      alert(`✅ Переведено ${fmt(amt, '₽')} игроку ${targetUser.nickname}`);
      setTransferAmount(''); setTransferTarget(''); setScreen('main');
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleExchange = () => {
    const amt = parseFloat(exchangeAmount);
    if (!amt || amt <= 0) return alert('Введите сумму');
    if (amt > rubBalance) return alert('Недостаточно рублей');
    
    const usdGot = amt / 80;
    onBalanceUpdate(balance + usdGot, rubBalance - amt);
    alert(`✅ Обменяно ${fmt(amt, '₽')} на ${fmt(usdGot, '$')}`);
    setExchangeAmount('');
  };

  const handleTrade = (type: 'buy' | 'sell') => {
    const amt = parseFloat(tradeAmount);
    if (!amt || amt <= 0) return alert('Введите количество');
    
    const price = livePrices[selectedCrypto] || CRYPTO_LIST.find(c => c.id === selectedCrypto)?.basePrice || 0;
    const totalRub = amt * price;

    if (type === 'buy') {
      if (totalRub > rubBalance) return alert('Недостаточно рублей');
      onBalanceUpdate(balance, rubBalance - totalRub);
      alert(`✅ Куплено ${amt} ${selectedCrypto.toUpperCase()} за ${fmt(totalRub, '₽')}`);
    } else {
      onBalanceUpdate(balance, rubBalance + totalRub);
      alert(`✅ Продано ${amt} ${selectedCrypto.toUpperCase()} за ${fmt(totalRub, '₽')}`);
    }
    setTradeAmount('');
  };

  const handleStake = () => {
    const amt = parseFloat(stakeInput);
    if (!amt || amt <= 0) return alert('Введите сумму');
    if (amt > balance) return alert('Недостаточно долларов');
    
    onBalanceUpdate(balance - amt, rubBalance);
    setStakedAmount(prev => prev + amt);
    alert(`✅ В стейкинг отправлено $${amt}. Доход: ${STAKING_CONFIG.dailyYieldPercent}%/день`);
    setStakeInput('');
  };

  const s: any = {
    overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 9999, overflowY: 'auto' },
    container: { maxWidth: 420, margin: '0 auto', padding: '16px 16px 40px', minHeight: '100vh' },
    header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
    avatar: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
    nickname: { fontSize: 22, fontWeight: '800', color: '#fff' },
    topGrid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12, marginBottom: 20 },
    actionBlock: { background: '#1C1C1E', borderRadius: 22, padding: 16, cursor: 'pointer', border: 'none', color: '#fff', textAlign: 'left' },
    infoBlock: { background: '#1C1C1E', borderRadius: 22, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    blockTitle: { fontSize: 17, fontWeight: '600', display: 'block', marginBottom: 4 },
    blockSub: { fontSize: 13, color: '#8E8E93', display: 'block' },
    progressBar: { height: 6, background: '#2C2C2E', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    progressFill: { width: '60%', height: '100%', background: 'linear-gradient(90deg, #00C6FF, #0072FF, #AF52DE, #FF2D55)', borderRadius: 3 },
    middleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 },
    midBtn: { background: '#1C1C1E', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' },
    midBtnText: { fontSize: 12, color: '#fff', fontWeight: '500' },
    cardWrapper: { background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)', borderRadius: 24, padding: 20, position: 'relative', cursor: 'pointer', marginBottom: 24, border: '1px solid #3A3A3C' },
    cardContent: { display: 'flex', flexDirection: 'column', gap: 16 },
    cardTop: { display: 'flex', alignItems: 'center', gap: 12 },
    currencyIcon: { width: 44, height: 44, borderRadius: 12, background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', color: '#fff' },
    cardBalance: { fontSize: 28, fontWeight: '800', color: '#fff', flex: 1 },
    cardLabel: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
    miniCard: { width: 60, height: 40, background: 'linear-gradient(135deg, #333, #111)', borderRadius: 8, border: '1px solid #444', marginTop: 4 },
    dots: { display: 'flex', flexDirection: 'column', gap: 3, marginLeft: 8 },
    dot: { width: 4, height: 4, borderRadius: '50%', background: '#666' },
    bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    bottomBtn: { background: '#1C1C1E', borderRadius: 22, padding: 20, cursor: 'pointer', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 },
    backBtn: { background: 'none', border: 'none', padding: 8, cursor: 'pointer' },
    input: { width: '100%', padding: '14px', borderRadius: 14, background: '#1C1C1E', border: '1px solid #2C2C2E', color: '#fff', fontSize: 16, marginBottom: 12, outline: 'none', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontWeight: '700', fontSize: 15, cursor: 'pointer', marginBottom: 8 },
    btnPrimary: { background: '#007AFF', color: '#fff' },
    list: { display: 'flex', flexDirection: 'column', gap: 12 },
    opItem: { background: '#1C1C1E', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
  };

  // ЭКРАН ОПЕРАЦИЙ
  if (screen === 'operations') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Все операции</span>
            <div style={{width: 24}} />
          </div>
          <div style={s.list}>
            {transactions.length === 0 ? (
              <div style={{textAlign: 'center', color: '#8E8E93', padding: 40}}>Нет операций</div>
            ) : (
              transactions.map((tx: any) => {
                const isOut = tx.sender_id === userId;
                const amount = isOut ? -tx.amount : tx.amount;
                const color = isOut ? '#FF453A' : '#34C759';
                const title = isOut ? 'Перевод/Оплата' : 'Пополнение';
                const date = new Date(tx.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={tx.id} style={s.opItem}>
                    <div>
                      <div style={{fontWeight: '500', color: '#fff'}}>{title}</div>
                      <div style={{fontSize: 13, color: '#8E8E93'}}>{date}</div>
                    </div>
                    <span style={{fontSize: 16, fontWeight: '600', color}}>
                      {amount > 0 ? '+' : ''}{fmt(amount, tx.currency)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ЭКРАН ПЕРЕВОДА
  if (screen === 'transfer') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Перевод</span>
            <div style={{width: 24}} />
          </div>
          <input style={s.input} placeholder="Никнейм получателя" value={transferTarget} onChange={e => setTransferTarget(e.target.value)} />
          <input style={s.input} placeholder="Сумма (₽)" type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
          <button style={{...s.btn, ...s.btnPrimary}} onClick={handleTransfer}>Перевести</button>
          <button style={{...s.btn, background: '#2C2C2E', color: '#fff'}} onClick={() => setScreen('main')}>Отмена</button>
        </div>
      </div>
    );
  }

  // ЭКРАН СЧЕТА
  if (screen === 'account') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Банковский счет</span>
            <div style={{width: 24}} />
          </div>
          <div style={{background: '#1C1C1E', borderRadius: 22, padding: 20, marginBottom: 16}}>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #2C2C2E'}}>
              <span style={{color: '#8E8E93'}}>Счет USD</span>
              <span style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>${fmt(bankUsd)}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0'}}>
              <span style={{color: '#8E8E93'}}>Счет RUB</span>
              <span style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>{fmt(bankRub, '₽')}</span>
            </div>
          </div>
          <button style={{...s.btn, ...s.btnPrimary}} onClick={() => { onBankUpdate(bankUsd + 100, bankRub); alert('Пополнено на $100'); }}>Пополнить $</button>
          <button style={{...s.btn, background: '#2C2C2E', color: '#fff'}} onClick={() => setScreen('main')}>Назад</button>
        </div>
      </div>
    );
  }

  // ЭКРАН ОБМЕНА
  if (screen === 'exchange') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Обмен валют</span>
            <div style={{width: 24}} />
          </div>
          <div style={{textAlign: 'center', marginBottom: 20, padding: 20, background: '#1C1C1E', borderRadius: 16}}>
            <div style={{fontSize: 13, color: '#8E8E93'}}>Курс обмена</div>
            <div style={{fontSize: 28, fontWeight: '800', color: '#fff', margin: '8px 0'}}>1 $ = 80 ₽</div>
          </div>
          <input style={s.input} placeholder="Сумма в ₽" type="number" value={exchangeAmount} onChange={e => setExchangeAmount(e.target.value)} />
          <button style={{...s.btn, ...s.btnPrimary}} onClick={handleExchange}>Обменять ₽ на $</button>
          <button style={{...s.btn, background: '#2C2C2E', color: '#fff'}} onClick={() => setScreen('main')}>Отмена</button>
        </div>
      </div>
    );
  }

  // ЭКРАН ТОРГОВЛИ
  if (screen === 'trade') {
    const crypto = CRYPTO_LIST.find(c => c.id === selectedCrypto);
    const currentPrice = livePrices[selectedCrypto] || crypto?.basePrice || 0;
    
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Торговля</span>
            <div style={{width: 24}} />
          </div>
          
          <div style={{maxHeight: 200, overflowY: 'auto', marginBottom: 16}}>
            {CRYPTO_LIST.map(c => (
              <div 
                key={c.id} 
                style={{...s.opItem, background: selectedCrypto === c.id ? '#2C2C2E' : '#1C1C1E', border: selectedCrypto === c.id ? '1px solid #007AFF' : '1px solid transparent', cursor: 'pointer'}}
                onClick={() => setSelectedCrypto(c.id)}
              >
                <span style={{fontWeight: 'bold', color: '#fff'}}>{c.name}</span>
                <span style={{color: '#8E8E93'}}>{fmt(livePrices[c.id] || c.basePrice, '₽')}</span>
              </div>
            ))}
          </div>

          <div style={{textAlign: 'center', marginBottom: 16, padding: 20, background: '#1C1C1E', borderRadius: 16}}>
            <div style={{fontSize: 13, color: '#8E8E93'}}>Курс {selectedCrypto.toUpperCase()}</div>
            <div style={{fontSize: 32, fontWeight: '800', color: '#fff'}}>{fmt(currentPrice, '₽')}</div>
          </div>

          <input style={s.input} placeholder="Количество монет" type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} />
          <div style={{display: 'flex', gap: 12}}>
            <button style={{...s.btn, ...s.btnPrimary, flex: 1, background: '#34C759'}} onClick={() => handleTrade('buy')}>Купить</button>
            <button style={{...s.btn, ...s.btnPrimary, flex: 1, background: '#FF453A'}} onClick={() => handleTrade('sell')}>Продать</button>
          </div>
          <button style={{...s.btn, background: '#2C2C2E', color: '#fff'}} onClick={() => setScreen('main')}>Назад</button>
        </div>
      </div>
    );
  }

  // ЭКРАН СТЕЙКИНГА
  if (screen === 'staking') {
    return (
      <div style={s.overlay} onClick={onClose}>
        <div style={s.container} onClick={e => e.stopPropagation()}>
          <div style={s.header}>
            <button onClick={() => setScreen('main')} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
            <span style={s.nickname}>Стейкинг</span>
            <div style={{width: 24}} />
          </div>
          <div style={{background: '#1C1C1E', borderRadius: 22, padding: 20, textAlign: 'center', marginBottom: 20}}>
            <Shield size={48} color="#FFD60A" style={{margin: '0 auto 12px'}}/>
            <div style={{fontSize: 14, color: '#8E8E93'}}>В стейкинге</div>
            <div style={{fontSize: 36, fontWeight: '800', color: '#FFD60A', margin: '8px 0'}}>${fmt(stakedAmount)}</div>
            <div style={{fontSize: 14, color: '#34C759'}}>+{STAKING_CONFIG.dailyYieldPercent}% / день</div>
          </div>
          <input style={s.input} placeholder="Сумма в $" type="number" value={stakeInput} onChange={e => setStakeInput(e.target.value)} />
          <button style={{...s.btn, ...s.btnPrimary}} onClick={handleStake}>Отправить в стейкинг</button>
          <button style={{...s.btn, background: '#2C2C2E', color: '#fff'}} onClick={() => setScreen('main')}>Назад</button>
        </div>
      </div>
    );
  }

  // ГЛАВНЫЙ ЭКРАН БАНКА (ПО РЕФЕРЕНСУ)
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.container} onClick={e => e.stopPropagation()}>
        {/* Шапка с аватаркой */}
        <div style={s.header}>
          <button onClick={onClose} style={s.backBtn}><ArrowLeft size={24} color="#fff" /></button>
          <div style={s.avatar}>{userNickname?.[0]?.toUpperCase() || 'U'}</div>
          <span style={s.nickname}>{userNickname} ›</span>
        </div>

        {/* Верхний ряд: Все операции + VIP */}
        <div style={s.topGrid}>
          <button style={s.actionBlock} onClick={() => setScreen('operations')}>
            <span style={s.blockTitle}>Все операции</span>
            <span style={s.blockSub}>Трат за месяц: {fmt(monthlySpend, '₽')}</span>
            <div style={s.progressBar}><div style={s.progressFill} /></div>
          </button>
          <div style={s.infoBlock}>
            <span style={s.blockTitle}>Покупай VIP</span>
            <span style={s.blockSub}>в донат магазине</span>
          </div>
        </div>

        {/* Средний ряд: 3 кнопки */}
        <div style={s.middleGrid}>
          <button style={s.midBtn} onClick={() => setScreen('transfer')}>
            <ArrowUpRight size={24} color="#007AFF" />
            <span style={s.midBtnText}>Перевести</span>
          </button>
          <button style={s.midBtn} onClick={() => setScreen('account')}>
            <Wallet size={24} color="#34C759" />
            <span style={s.midBtnText}>Мой Б/С</span>
          </button>
          <button style={s.midBtn} onClick={() => setScreen('exchange')}>
            <Repeat size={24} color="#AF52DE" />
            <span style={s.midBtnText}>Обменять</span>
          </button>
        </div>

        {/* Карточка-кошелек (переворачивается) */}
        <div style={s.cardWrapper} onClick={() => setCardSide(cardSide === 'rub' ? 'usd' : 'rub')}>
          <div style={s.cardContent}>
            <div style={s.cardTop}>
              <div style={s.currencyIcon}>
                {cardSide === 'rub' ? '₽' : '$'}
              </div>
              <span style={s.cardBalance}>
                {cardSide === 'rub' ? fmt(rubBalance, '₽') : fmt(balance, '$')}
              </span>
              <div style={s.dots}>
                <div style={s.dot} />
                <div style={s.dot} />
              </div>
            </div>
            <span style={s.cardLabel}>Black WSP</span>
            <div style={s.miniCard} />
          </div>
        </div>

        {/* Нижний ряд: Торговля + Стейкинг */}
        <div style={s.bottomGrid}>
          <button style={s.bottomBtn} onClick={() => setScreen('trade')}>
            <div style={{width: 44, height: 44, borderRadius: 12, background: 'rgba(52, 199, 89, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <TrendingUp size={24} color="#34C759" />
            </div>
            <div>
              <div style={{fontWeight: '600', fontSize: 15}}>Торговля</div>
              <div style={{fontSize: 12, color: '#8E8E93'}}>Криптобиржа</div>
            </div>
          </button>
          <button style={s.bottomBtn} onClick={() => setScreen('staking')}>
            <div style={{width: 44, height: 44, borderRadius: 12, background: 'rgba(255, 214, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Shield size={24} color="#FFD60A" />
            </div>
            <div>
              <div style={{fontWeight: '600', fontSize: 15}}>Стейкинг</div>
              <div style={{fontSize: 12, color: '#8E8E93'}}>{STAKING_CONFIG.dailyYieldPercent}% в день</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};