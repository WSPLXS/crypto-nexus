import React, { useState, useEffect, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import { Handshake } from 'lucide-react';
import { Auth } from './components/Auth';
import { GPU } from './components/GPU';
import { TopMenu } from './components/TopMenu';
import { Settings } from './components/Settings';
import { Shop } from './components/Shop';
import { CurrencySelector } from './components/CurrencySelector';
import { Search } from './components/Search';
import { Referral } from './components/Referral';
import type { OwnedCurrency } from './types';
import { currencies } from './data/currencies';
import { getLevelInfo, getGlobalMultiplier } from './data/levels';
import { supabase } from './lib/supabase';

function App() {
   // 🔧 ПОЛУЧЕНИЕ ID ПОЛЬЗОВАТЕЛЯ
  let userIdNum: number;
  
  try {
    // Пытаемся получить ID из Telegram
    if (WebApp?.initDataUnsafe?.user?.id) {
      userIdNum = Number(WebApp.initDataUnsafe.user.id);
      console.log('✅ Telegram User ID:', userIdNum);
    } else {
      // Если не Telegram — генерируем гостевой ID
      const savedGuestId = localStorage.getItem('cryptoNexus_guestId');
      if (savedGuestId) {
        userIdNum = Number(savedGuestId);
      } else {
        userIdNum = Math.floor(Date.now() + Math.random() * 100000);
        localStorage.setItem('cryptoNexus_guestId', userIdNum.toString());
      }
      console.log('👤 Guest User ID:', userIdNum);
    }
  } catch (e) {
    console.error('❌ Ошибка получения ID:', e);
    // Фолбэк на гостевой ID
    userIdNum = Number(localStorage.getItem('cryptoNexus_guestId')) || Math.floor(Date.now() + Math.random() * 100000);
  }

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('cryptoNexus_nickname'));
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  
  const [showEarnings, setShowEarnings] = useState(false);
  const [earningsAmount, setEarningsAmount] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [showOfflineEarnings, setShowOfflineEarnings] = useState(false);
  const [offlineAmount, setOfflineAmount] = useState(0);

  const [balance, setBalance] = useState(100);
  const [maxBalance, setMaxBalance] = useState(100);
  const [ownedCurrencies, setOwnedCurrencies] = useState<OwnedCurrency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('btc');
  const [priceMultipliers, setPriceMultipliers] = useState<Record<string, number>>({});
  
  const [totalSpent, setTotalSpent] = useState(0);
  const [referralBonusGiven, setReferralBonusGiven] = useState(false);
  const [referrerId, setReferrerId] = useState<number | null>(null);

  const saveProgress = async () => {
    if (isLoading) return;
    try {
      await supabase.from('users').upsert({
        id: userIdNum,
        balance,
        max_balance: maxBalance,
        owned_currencies: ownedCurrencies,
        price_multipliers: priceMultipliers,
        selected_currency: selectedCurrencyId,
        last_login: new Date().toISOString(),
        total_spent: totalSpent,
        referrer_id: referrerId,
        referral_bonus_awarded: referralBonusGiven
      }, { onConflict: 'id' });
    } catch (err) {
      console.error('❌ Ошибка сохранения:', err);
    }
  };

  useEffect(() => {
    async function loadProgress() {
      try {
        const { data } = await supabase.from('users').select('*').eq('id', userIdNum).single();
        if (data) {
          setBalance(data.balance || 100);
          setMaxBalance(data.max_balance || 100);
          setOwnedCurrencies(data.owned_currencies || []);
          setPriceMultipliers(data.price_multipliers || {});
          setSelectedCurrencyId(data.selected_currency || 'btc');
          setTotalSpent(data.total_spent || 0);
          setReferrerId(data.referrer_id || null);
          setReferralBonusGiven(data.referral_bonus_awarded || false);

          if (data.last_login && data.owned_currencies?.length > 0) {
            const diff = Math.floor((Date.now() - new Date(data.last_login).getTime()) / 1000);
            if (diff > 0) {
              const incomeSec = data.owned_currencies.reduce((t: number, o: OwnedCurrency) => {
                const c = currencies.find(cur => cur.id === o.currencyId);
                const g = getGlobalMultiplier(getLevelInfo(data.max_balance || 100).tier);
                return t + (c ? c.incomePerSecond * o.amount * g : 0);
              }, 0);
              const offEarn = incomeSec * diff * 0.2;
              if (offEarn > 0) {
                setOfflineAmount(offEarn);
                setBalance(prev => prev + offEarn);
                setShowOfflineEarnings(true);
                setTimeout(() => setShowOfflineEarnings(false), 5000);
              }
            }
          }
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
    const i = setInterval(saveProgress, 15000);
    return () => clearInterval(i);
  }, [isLoading, balance, maxBalance, ownedCurrencies, priceMultipliers, selectedCurrencyId, totalSpent, referrerId, referralBonusGiven]);

  useEffect(() => {
    if (isLoading) return;
    const h = () => document.hidden && saveProgress();
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [isLoading, balance, maxBalance, ownedCurrencies, priceMultipliers, selectedCurrencyId, totalSpent]);

  useEffect(() => {
    try {
      if (WebApp?.ready) { WebApp.ready(); WebApp.expand(); }
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const { level, progress, tier } = getLevelInfo(maxBalance);
  const globalMultiplier = getGlobalMultiplier(tier);

  const totalIncome = useMemo(() => {
    return ownedCurrencies.reduce((t, o) => {
      const c = currencies.find(cur => cur.id === o.currencyId);
      return t + (c ? c.incomePerSecond * o.amount * globalMultiplier : 0);
    }, 0);
  }, [ownedCurrencies, globalMultiplier]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    const i = setInterval(() => {
      if (totalIncome > 0) {
        setBalance(p => {
          const n = p + totalIncome;
          setMaxBalance(m => Math.max(m, n));
          return n;
        });
        if (!showEarnings) { setEarningsAmount(totalIncome); setShowEarnings(true); }
      }
    }, 1000);
    return () => clearInterval(i);
  }, [isAuthenticated, totalIncome, showEarnings, isLoading]);

  const handleAuthComplete = (nickname: string, refId?: number | null) => {
    localStorage.setItem('cryptoNexus_nickname', nickname);
    if (refId && refId !== userIdNum) setReferrerId(refId);
    setIsAuthenticated(true);
    setShowTutorial(true);
    setTimeout(() => saveProgress(), 500);
  };

  const handleBuy = (currencyId: string, amount: number) => {
    const base = currencies.find(c => c.id === currencyId);
    if (!base) return;
    const mult = priceMultipliers[currencyId] || 1;
    const price = base.price * mult * amount;

    if (balance >= price) {
      setBalance(p => p - price);
      setTotalSpent(p => p + price);
      
      setOwnedCurrencies(prev => {
        const ex = prev.find(c => c.currencyId === currencyId);
        return ex ? prev.map(c => c.currencyId === currencyId ? {...c, amount: c.amount + amount} : c) : [...prev, {currencyId, amount}];
      });
      setPriceMultipliers(prev => ({...prev, [currencyId]: mult * 1.15}));
      if (!ownedCurrencies.find(c => c.currencyId === currencyId)) setSelectedCurrencyId(currencyId);

      const newTotal = totalSpent + price;
      if (newTotal >= 50 && referrerId && !referralBonusGiven) {
        setReferralBonusGiven(true);
        supabase.from('users').select('balance').eq('id', referrerId).single().then(({data}) => {
          if(data) supabase.from('users').update({balance: (data.balance || 0) + 1000}).eq('id', referrerId);
        });
        console.log('🎁 Реферальный бонус $1000 начислен!');
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
      <div style={styles.container}>
        <div style={styles.levelBar}>
          <span style={styles.levelText}>Lvl {level}</span>
          <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${progress}%` }}></div></div>
          <span style={styles.levelText}>{level === 30 ? 'MAX' : `Lvl ${level + 1}`}</span>
        </div>

        {/* ВЕРХНЯЯ ПАНЕЛЬ */}
        <div style={styles.topBar}>
          {/* ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ СЛЕВА */}
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
          
          {/* КНОПКИ СПРАВА (ВЕРТИКАЛЬНО) */}
          <div style={styles.rightMenuContainer}>
            <TopMenu 
              onSettingsClick={() => setShowSettings(true)} 
              onClanClick={() => {}} 
              onFriendsClick={() => {}} 
              onShopClick={() => setShowShop(true)}
              onSearchClick={() => setShowSearch(true)}
            />
          </div>
        </div>
        
        {/* КНОПКА РЕФЕРАЛОВ СЛЕВА (ОТДЕЛЬНО) */}
        <button onClick={() => setShowReferral(true)} style={styles.referralBtn}>
           <Handshake size={22} color="var(--text-primary)" />
        </button>

        <div style={styles.center}><GPU tier={tier} isMining={totalIncome > 0} /></div>

        {showEarnings && <div className="earnings-anim" style={{ position: 'fixed', top: '40%', left: '50%', fontSize: 20, fontWeight: 'bold', color: 'var(--success)', zIndex: 999 }}>+${earningsAmount.toFixed(2)}/s</div>}
        
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

        <div style={styles.bottomBar}>
          <div style={styles.bottomSection}><span style={styles.earnings}>+${(totalIncome * 60).toFixed(2)}/min</span></div>
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
        <Referral isOpen={showReferral} onClose={() => setShowReferral(false)} currentUserId={userIdNum} />

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
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { width: '100vw', height: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', transition: 'background 0.3s' },
  levelBar: { position: 'absolute', top: 12, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 100 },
  levelText: { fontSize: 12, fontWeight: '600', color: 'var(--text-secondary)' },
  progressTrack: { width: 140, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s ease' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, padding: '16px', paddingTop: 40, background: 'linear-gradient(180deg, var(--bg-panel) 0%, transparent 100%)', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' },
  userSection: { display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold', color: 'white' },
  userInfo: { flex: 1 },
  nickname: { fontSize: 15, fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' },
  balances: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  
  // 🔥 КОНТЕЙНЕР ДЛЯ ВЕРТИКАЛЬНОГО МЕНЮ СПРАВА
  rightMenuContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
    pointerEvents: 'auto'
  },
  
  referralBtn: { 
    position: 'absolute', 
    left: 16, 
    top: 110, 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    background: 'rgba(38,38,38,0.4)', 
    backdropFilter: 'blur(12px)', 
    border: '1px solid rgba(156,163,175,0.15)', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 100, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'transform 0.1s'
  },
  
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
  offlineOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  offlineModal: { background: '#141414', border: '2px solid #22c55e', borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: '0 0 50px rgba(34,197,94,0.4)', minWidth: 280 },
  offlineIcon: { fontSize: 48, marginBottom: 12 },
  offlineTitle: { fontSize: 22, fontWeight: 'bold', color: '#22c55e', marginBottom: 8 },
  offlineAmount: { fontSize: 36, fontWeight: 'bold', color: '#4ade80', marginBottom: 8, textShadow: '0 0 20px rgba(74,222,128,0.5)' },
  offlineText: { fontSize: 14, color: '#9ca3af' }
};

export default App;