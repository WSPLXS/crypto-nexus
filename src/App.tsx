import React, { useState, useEffect, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import { Auth } from './components/Auth';
import { GPU } from './components/GPU';
import { TopMenu } from './components/TopMenu';
import { Settings } from './components/Settings';
import { Shop } from './components/Shop';
import { CurrencySelector } from './components/CurrencySelector';
import { Search } from './components/Search';
import type { OwnedCurrency } from './types';
import { currencies } from './data/currencies';
import { getLevelInfo, getGlobalMultiplier } from './data/levels';
import { supabase } from './lib/supabase';

function App() {
  let userIdNum = 123456;
  
  try {
    if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
      const rawId = WebApp.initDataUnsafe.user.id;
      if (rawId && !isNaN(Number(rawId))) {
        userIdNum = Number(rawId);
      }
    }
  } catch (e) {
    console.warn('Не удалось получить Telegram ID');
  }

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('cryptoNexus_nickname'));
  
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const [showEarnings, setShowEarnings] = useState(false);
  const [earningsAmount, setEarningsAmount] = useState(0);
  const [isDark, setIsDark] = useState(true);
  
  // 🔥 СОСТОЯНИЕ ДЛЯ ОФФЛАЙН-ДОХОДА
  const [showOfflineEarnings, setShowOfflineEarnings] = useState(false);
  const [offlineAmount, setOfflineAmount] = useState(0);

  const [balance, setBalance] = useState(100);
  const [maxBalance, setMaxBalance] = useState(100);
  const [ownedCurrencies, setOwnedCurrencies] = useState<OwnedCurrency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('btc');
  const [priceMultipliers, setPriceMultipliers] = useState<Record<string, number>>({});

  const saveProgress = async () => {
    if (isLoading) return;
    try {
      console.log('💾 Сохранение (ID:', userIdNum, ')...');
      
      await supabase
        .from('users')
        .upsert({
          id: userIdNum,
          balance,
          max_balance: maxBalance,
          owned_currencies: ownedCurrencies,
          price_multipliers: priceMultipliers,
          selected_currency: selectedCurrencyId,
          last_login: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      console.log('✅ Сохранено успешно!');
    } catch (err) {
      console.error('❌ Ошибка сохранения:', err);
    }
  };

  useEffect(() => {
    async function loadProgress() {
      try {
        console.log('📥 Загрузка для ID:', userIdNum);
        
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', userIdNum)
          .single();

        if (data) {
          console.log('📥 Данные загружены:', data);
          
          if (data.last_login && data.owned_currencies && data.owned_currencies.length > 0) {
            const lastLogin = new Date(data.last_login).getTime();
            const now = Date.now();
            const offlineSeconds = Math.floor((now - lastLogin) / 1000);
            
            if (offlineSeconds > 0) {
              const incomePerSecond = data.owned_currencies.reduce((total: number, owned: OwnedCurrency) => {
                const c = currencies.find(cur => cur.id === owned.currencyId);
                const globalMult = getGlobalMultiplier(getLevelInfo(data.max_balance || 100).tier);
                return total + (c ? c.incomePerSecond * owned.amount * globalMult : 0);
              }, 0);
              
              const offlineMultiplier = 0.2;
              const offlineEarnings = incomePerSecond * offlineSeconds * offlineMultiplier;
              
              if (offlineEarnings > 0) {
                console.log(`💰 Оффлайн-доход: $${offlineEarnings.toFixed(2)} за ${offlineSeconds} сек`);
                setOfflineAmount(offlineEarnings);
                // Начисляем к балансу
                setBalance((data.balance || 100) + offlineEarnings);
                setShowOfflineEarnings(true); // Показываем окно
                
                // Скрываем через 5 секунд
                setTimeout(() => setShowOfflineEarnings(false), 5000);
              } else {
                setBalance(data.balance || 100);
              }
            } else {
              setBalance(data.balance || 100);
            }
          } else {
            setBalance(data.balance || 100);
          }
          
          setMaxBalance(data.max_balance || 100);
          setOwnedCurrencies(data.owned_currencies || []);
          setPriceMultipliers(data.price_multipliers || {});
          setSelectedCurrencyId(data.selected_currency || 'btc');
        } else {
          console.log('🆕 Новый пользователь');
        }
      } catch (err) {
        console.error('❌ Ошибка загрузки:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProgress();
  }, [userIdNum]);

  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      saveProgress();
    }, 15000);
    return () => clearInterval(interval);
  }, [isLoading, balance, maxBalance, ownedCurrencies, priceMultipliers, selectedCurrencyId]);

  useEffect(() => {
    if (isLoading) return;
    const handleVisibility = () => {
      if (document.hidden) saveProgress();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isLoading, balance, maxBalance, ownedCurrencies, priceMultipliers, selectedCurrencyId]);

  useEffect(() => {
    try {
      if (WebApp && typeof WebApp.ready === 'function') {
        WebApp.ready();
        WebApp.expand();
      }
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const { level, progress, tier } = getLevelInfo(maxBalance);
  const globalMultiplier = getGlobalMultiplier(tier);

  const totalIncome = useMemo(() => {
    return ownedCurrencies.reduce((total, owned) => {
      const c = currencies.find(cur => cur.id === owned.currencyId);
      return total + (c ? c.incomePerSecond * owned.amount * globalMultiplier : 0);
    }, 0);
  }, [ownedCurrencies, globalMultiplier]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    const interval = setInterval(() => {
      if (totalIncome > 0) {
        setBalance((prev: number) => {
          const newBal = prev + totalIncome;
          setMaxBalance((max: number) => Math.max(max, newBal));
          return newBal;
        });
        if (!showEarnings) { 
          setEarningsAmount(totalIncome); 
          setShowEarnings(true); 
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, totalIncome, showEarnings, isLoading]);

  const handleAuthComplete = (nickname: string) => {
    localStorage.setItem('cryptoNexus_nickname', nickname);
    setIsAuthenticated(true);
    setShowTutorial(true);
    setTimeout(() => saveProgress(), 500);
  };

  const handleBuy = (currencyId: string, amount: number) => {
    const baseCurrency = currencies.find(c => c.id === currencyId);
    if (!baseCurrency) return;
    
    const currentMult = priceMultipliers[currencyId] || 1;
    const currentPrice = baseCurrency.price * currentMult;
    const totalPrice = currentPrice * amount;

    if (balance >= totalPrice) {
      setBalance((prev: number) => prev - totalPrice);
      
      setOwnedCurrencies((prev: OwnedCurrency[]) => {
        const existing = prev.find(c => c.currencyId === currencyId);
        return existing 
          ? prev.map(c => c.currencyId === currencyId ? { ...c, amount: c.amount + amount } : c) 
          : [...prev, { currencyId, amount }];
      });

      setPriceMultipliers((prev: Record<string, number>) => ({
        ...prev,
        [currencyId]: currentMult * 1.15
      }));
      
      if (!ownedCurrencies.find(c => c.currencyId === currencyId)) {
        setSelectedCurrencyId(currencyId);
      }
      setTimeout(() => saveProgress(), 100);
    }
  };

  if (isLoading) return <div style={{color:'white', textAlign:'center', marginTop:'50vh'}}>Загрузка...</div>;
  if (!isAuthenticated) return <Auth onComplete={handleAuthComplete} />;

  const selectedCurrency = currencies.find(c => c.id === selectedCurrencyId);
  const nickname = localStorage.getItem('cryptoNexus_nickname') || 'Player';

  return (
    <>
      {/* ИГРОВОЙ КОНТЕЙНЕР */}
      <div style={styles.container}>
        <div style={styles.levelBar}>
          <span style={styles.levelText}>Lvl {level}</span>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }}></div>
          </div>
          <span style={styles.levelText}>{level === 30 ? 'MAX' : `Lvl ${level + 1}`}</span>
        </div>

        <div style={styles.topBar}>
          <div style={styles.userSection}>
            <div style={styles.avatar}>{nickname[0].toUpperCase()}</div>
            <div style={styles.userInfo}>
              <span style={styles.nickname}>{nickname}</span>
              <div style={styles.balances}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: 15 }}>
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(156,163,175,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                  x{globalMultiplier.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          <TopMenu 
            onSettingsClick={() => setShowSettings(true)} 
            onClanClick={() => {}} 
            onFriendsClick={() => {}} 
            onShopClick={() => setShowShop(true)}
            onSearchClick={() => setShowSearch(true)}
          />
        </div>

        <div style={styles.center}>
          <GPU tier={tier} isMining={totalIncome > 0} />
        </div>

        {showEarnings && (
          <div className="earnings-anim" style={{ position: 'fixed', top: '40%', left: '50%', fontSize: 20, fontWeight: 'bold', color: 'var(--success)', zIndex: 999 }}>
            +${earningsAmount.toFixed(2)}/s
          </div>
        )}

        <div style={styles.bottomBar}>
          <div style={styles.bottomSection}>
            <span style={styles.earnings}>+${(totalIncome * 60).toFixed(2)}/min</span>
          </div>
          <button onClick={() => setShowCurrencySelector(true)} style={styles.currencyBtn}>
            <span style={styles.currencyName}>{selectedCurrency?.shortName || 'USD'}</span>
            <span style={styles.arrow}>▼</span>
          </button>
          <div style={styles.bottomSection}></div>
        </div>

        <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} musicVolume={50} sfxVolume={50} isDark={isDark} onThemeToggle={() => setIsDark(!isDark)} onSave={() => {}} />
        <Shop isOpen={showShop} onClose={() => setShowShop(false)} balance={balance} priceMultipliers={priceMultipliers} onBuy={handleBuy} />
        <CurrencySelector isOpen={showCurrencySelector} onClose={() => setShowCurrencySelector(false)} ownedCurrencies={ownedCurrencies} selectedCurrency={selectedCurrencyId} onSelect={setSelectedCurrencyId} />
        <Search isOpen={showSearch} onClose={() => setShowSearch(false)} balance={balance} priceMultipliers={priceMultipliers} onBuy={handleBuy} />

        {showTutorial && (
          <div style={styles.tutorialOverlay}>
            <div style={styles.tutorialModal}>
              <h2 style={styles.tutorialTitle}>🎮 Обучение</h2>
              <p style={styles.tutorialText}>Добро пожаловать! У тебя $100 на старте. Купи первую монету, чтобы запустить доход.</p>
              <button onClick={() => { setShowTutorial(false); setShowShop(true); }} style={styles.tutorialBtn}>В магазин!</button>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 УВЕДОМЛЕНИЕ ОБ ОФФЛАЙН-ДОХОДЕ (ВЫНЕСЕНО ЗА КОНТЕЙНЕР) */}
      {showOfflineEarnings && (
        <div style={styles.offlineOverlay}>
          <div style={styles.offlineModal}>
            <div style={styles.offlineIcon}>💰</div>
            <div style={styles.offlineTitle}>Пока тебя не было!</div>
            <div style={styles.offlineAmount}>+${offlineAmount.toFixed(2)}</div>
            <div style={styles.offlineText}>Твои майнеры заработали</div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { width: '100vw', height: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', transition: 'background 0.3s' },
  levelBar: { position: 'absolute', top: 12, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 100 },
  levelText: { fontSize: 12, fontWeight: '600', color: 'var(--text-secondary)' },
  progressTrack: { width: 140, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s ease' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, padding: '16px', paddingTop: 40, background: 'linear-gradient(180deg, var(--bg-panel) 0%, transparent 100%)', zIndex: 100 },
  userSection: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold', color: 'white' },
  userInfo: { flex: 1 },
  nickname: { fontSize: 15, fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' },
  balances: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  center: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', paddingTop: 40 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg-panel)', padding: '20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', backdropFilter: 'blur(12px)' },
  bottomSection: { flex: 1 },
  earnings: { fontSize: 16, fontWeight: 'bold', color: 'var(--success)' },
  currencyBtn: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-primary)' },
  currencyName: { fontSize: 16, fontWeight: 'bold', color: 'var(--accent)' },
  arrow: { fontSize: 10, color: 'var(--text-secondary)' },
  tutorialOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' },
  tutorialModal: { background: 'var(--bg-panel)', borderRadius: 20, padding: 32, maxWidth: '85%', width: 320, textAlign: 'center', border: '1px solid var(--border)' },
  tutorialTitle: { fontSize: 22, fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 12 },
  tutorialText: { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 },
  tutorialBtn: { padding: '12px 28px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: '600', cursor: 'pointer' },
  
  // 🔥 СТИЛИ ДЛЯ ОФФЛАЙН-УВЕДОМЛЕНИЯ (ЦЕНТР ЭКРАНА + ЗАТЕМНЕНИЕ)
  offlineOverlay: {
    position: 'fixed',
    inset: 0, // Растягивается на весь экран
    background: 'rgba(0, 0, 0, 0.85)', // Затемнение
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Поверх всего
    backdropFilter: 'blur(8px)' // Размытие фона
  },
  offlineModal: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
    border: '2px solid #22c55e',
    borderRadius: 24,
    padding: '32px 24px',
    textAlign: 'center',
    boxShadow: '0 0 50px rgba(34, 197, 94, 0.4)',
    minWidth: 280,
    animation: 'popIn 0.3s ease-out'
  },
  offlineIcon: { fontSize: 48, marginBottom: 12 },
  offlineTitle: { fontSize: 22, fontWeight: 'bold', color: '#22c55e', marginBottom: 8 },
  offlineAmount: { fontSize: 36, fontWeight: 'bold', color: '#4ade80', marginBottom: 8, textShadow: '0 0 20px rgba(74, 222, 128, 0.5)' },
  offlineText: { fontSize: 14, color: '#9ca3af' }
};

export default App;