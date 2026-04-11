import React, { useState, useEffect, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import { Handshake, Trophy } from 'lucide-react';
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

interface LeaderboardPlayer {
  id: number;
  nickname: string;
  incomePerMin: number;
}

function App() {
  let userIdNum: number;
  
  try {
    if (WebApp?.initDataUnsafe?.user?.id) {
      userIdNum = Number(WebApp.initDataUnsafe.user.id);
    } else {
      const savedGuestId = localStorage.getItem('cryptoNexus_guestId');
      if (savedGuestId) {
        userIdNum = Number(savedGuestId);
      } else {
        userIdNum = Math.floor(Date.now() + Math.random() * 100000);
        localStorage.setItem('cryptoNexus_guestId', userIdNum.toString());
      }
    }
  } catch (e) {
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const [showEarnings, setShowEarnings] = useState(false);
  const [earningsAmount, setEarningsAmount] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [showOfflineEarnings, setShowOfflineEarnings] = useState(false);
  const [offlineAmount, setOfflineAmount] = useState(0);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showAvatarPrompt, setShowAvatarPrompt] = useState(false);
  const [showAvatarInstruction, setShowAvatarInstruction] = useState(false);

  const [balance, setBalance] = useState(100);
  const [maxBalance, setMaxBalance] = useState(100);
  const [ownedCurrencies, setOwnedCurrencies] = useState<OwnedCurrency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('btc');
  const [priceMultipliers, setPriceMultipliers] = useState<Record<string, number>>({});
  
  const [totalSpent, setTotalSpent] = useState(0);
  const [referralBonusGiven, setReferralBonusGiven] = useState(false);
  const [referrerId, setReferrerId] = useState<number | null>(null);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // ✅ НИКНЕЙМ СОХРАНЯЕТСЯ В БАЗУ
  const saveProgress = async () => {
    if (isLoading) return;
    try {
      const currentNickname = localStorage.getItem('cryptoNexus_nickname') || `Player${userIdNum}`;
      await supabase.from('users').upsert({
        id: userIdNum,
        nickname: currentNickname, // 🔥 Сохраняем ник
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
      console.error('❌ Save error:', err);
    }
  };

  // 🔥 РАСЧЁТ ДОХОДА В МИНУТУ
  const calculateIncomePerMin = (userData: any) => {
    try {
      if (!userData?.owned_currencies || !Array.isArray(userData.owned_currencies) || userData.owned_currencies.length === 0) return 0;
      const tier = getLevelInfo(userData.max_balance || 0).tier;
      const globalMult = getGlobalMultiplier(tier);
      let totalSec = 0;
      for (const owned of userData.owned_currencies) {
        const c = currencies.find(cur => cur.id === owned.currencyId);
        if (c && owned.amount > 0) totalSec += c.incomePerSecond * owned.amount * globalMult;
      }
      return totalSec * 60;
    } catch (e) {
      return 0;
    }
  };

  // 🔥 ЗАГРУЗКА И СОРТИРОВКА ТОПА (ТЕПЕРЬ ЧИТАЕТ НИК ИЗ БАЗЫ)
  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      console.log('🏆 Загрузка топа...');
      const { data, error } = await supabase
        .from('users')
        .select('id, nickname, owned_currencies, max_balance');

      if (error) throw error;
      console.log(`📦 Получено аккаунтов: ${data?.length || 0}`);

      const sorted = (data || [])
        .map(u => ({
          id: u.id,
          nickname: u.nickname || `Player${String(u.id).slice(-4)}`, // Реальный ник из базы
          incomePerMin: calculateIncomePerMin(u)
        }))
        .sort((a, b) => b.incomePerMin - a.incomePerMin) // По убыванию
        .slice(0, 10); // Топ-10

      setLeaderboard(sorted);
      console.log('✅ Топ обновлён:', sorted);
    } catch (err) {
      console.error('❌ Ошибка топа:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (showLeaderboard && isAuthenticated) fetchLeaderboard();
  }, [showLeaderboard]);

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

          if (data.custom_avatar_url) setAvatarUrl(`${data.custom_avatar_url}?t=${Date.now()}`);
          else if (WebApp.initDataUnsafe?.user?.photo_url) setAvatarUrl(WebApp.initDataUnsafe.user.photo_url);
          else setAvatarUrl(null);

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
        console.error('❌ Load error:', err);
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
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (showAvatarInstruction) {
      timer = setTimeout(() => { setShowAvatarInstruction(false); setShowTutorial(true); }, 30000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [showAvatarInstruction]);

  useEffect(() => {
    try { if (WebApp?.ready) { WebApp.ready(); WebApp.expand(); } } catch (e) {}
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
        setBalance(p => { const n = p + totalIncome; setMaxBalance(m => Math.max(m, n)); return n; });
        if (!showEarnings) { setEarningsAmount(totalIncome); setShowEarnings(true); }
      }
    }, 1000);
    return () => clearInterval(i);
  }, [isAuthenticated, totalIncome, showEarnings, isLoading]);

  const handleAuthComplete = (nickname: string, refId?: number | null) => {
    localStorage.setItem('cryptoNexus_nickname', nickname);
    if (refId && refId !== userIdNum) setReferrerId(refId);
    setIsAuthenticated(true);
    setShowAvatarPrompt(true);
    setTimeout(() => saveProgress(), 500); // Сохраняем ник в базу
  };

  const handleAvatarYes = () => { setShowAvatarPrompt(false); setShowAvatarInstruction(true); };
  const handleAvatarNo = () => { setShowAvatarPrompt(false); setShowTutorial(true); };

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

        <div style={styles.topBar}>
          <div style={styles.userSection}>
            <div style={styles.avatarWrapper}>
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={styles.avatarImg} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span style={styles.avatarText}>{nickname[0].toUpperCase()}</span>}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.nickname}>{nickname}</span>
              <div style={styles.balances}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: 15 }}>
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(156,163,175,0.1)', padding: '2px 8px', borderRadius: 6 }}>x{globalMultiplier.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <div style={styles.rightMenuContainer}>
            <TopMenu onSettingsClick={() => setShowSettings(true)} onClanClick={() => {}} onFriendsClick={() => {}} onShopClick={() => setShowShop(true)} onSearchClick={() => setShowSearch(true)} />
          </div>
        </div>
        
        <div style={styles.leftButtons}>
          <button onClick={() => setShowLeaderboard(true)} style={styles.leftBtn}><Trophy size={20} color="var(--text-primary)" /></button>
          <button onClick={() => setShowReferral(true)} style={styles.leftBtn}><Handshake size={20} color="var(--text-primary)" /></button>
        </div>

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

        {showAvatarPrompt && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3 style={styles.modalTitle}>Хочешь поставить свою аватарку? (БЕТА)</h3>
              <div style={styles.btnRow}>
                <button onClick={handleAvatarYes} style={styles.btnYes}>Да</button>
                <button onClick={handleAvatarNo} style={styles.btnNo}>Нет</button>
              </div>
            </div>
          </div>
        )}

        {showAvatarInstruction && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3 style={styles.modalTitle}>Установка аватарки</h3>
              <p style={styles.modalText}>Перейди в бота <b>@NexusGameAvatar_bot</b> и отправь ему любое фото.<br/>Бот автоматически обновит твою аватарку в игре.</p>
              <a href="https://t.me/NexusGameAvatar_bot" target="_blank" rel="noopener noreferrer" style={styles.botLink}>Открыть бота 🤖</a>
              <p style={styles.modalHint}>⏳ Окно закроется автоматически через 30 сек...</p>
            </div>
          </div>
        )}

        {/* 🔥 МЕНЮ ТОП-10 */}
        {showLeaderboard && (
          <div style={styles.overlay} onClick={() => setShowLeaderboard(false)}>
            <div style={styles.leaderboardModal} onClick={e => e.stopPropagation()}>
              <div style={styles.leaderboardHeader}>
                <h2 style={styles.leaderboardTitle}>🏆 Самые богатые</h2>
                <button onClick={() => setShowLeaderboard(false)} style={styles.closeBtn}>✕</button>
              </div>
              
              {leaderboardLoading ? (
                <div style={styles.loadingText}>Загрузка...</div>
              ) : leaderboard.length === 0 ? (
                <div style={styles.emptyText}>Пока нет игроков с доходом.<br/>Купи первую валюту, чтобы попасть в топ!</div>
              ) : (
                <div style={styles.leaderboardList}>
                  {leaderboard.map((player, index) => (
                    <div key={player.id} style={styles.leaderboardItem}>
                      <span style={{
                        ...styles.rank,
                        ...(index === 0 ? styles.rank1 : index === 1 ? styles.rank2 : index === 2 ? styles.rank3 : {})
                      }}>
                        {index + 1}
                      </span>
                      <div style={styles.playerInfo}>
                        <span style={styles.playerName}>{player.nickname}</span>
                        <span style={styles.playerIncome}>+${player.incomePerMin.toFixed(2)}/мин</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p style={styles.leaderboardHint}>Обновляется автоматически каждые 15 минут</p>
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
  avatarWrapper: { width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  userInfo: { flex: 1 },
  nickname: { fontSize: 15, fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' },
  balances: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  rightMenuContainer: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'auto' },
  leftButtons: { position: 'absolute', left: 16, top: 110, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 100 },
  leftBtn: { width: 44, height: 44, borderRadius: 12, background: 'rgba(38,38,38,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(156,163,175,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.1s' },
  center: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', paddingTop: 40 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg-panel)', padding: '20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', backdropFilter: 'blur(12px)' },
  bottomSection: { flex: 1 },
  earnings: { fontSize: 16, fontWeight: 'bold', color: 'var(--success)' },
  currencyBtn: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-primary)' },
  currencyName: { fontSize: 16, fontWeight: 'bold', color: 'var(--accent)' },
  arrow: { fontSize: 10, color: 'var(--text-secondary)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  modal: { background: '#141414', border: '1px solid rgba(156,163,175,0.15)', borderRadius: 20, padding: 24, maxWidth: '90%', width: 320, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#e5e5e5', marginBottom: 16, margin: '0 0 16px 0' },
  modalText: { fontSize: 14, color: '#a3a3a3', lineHeight: 1.5, marginBottom: 16 },
  modalHint: { fontSize: 12, color: '#525252', marginTop: 12, fontStyle: 'italic' },
  btnRow: { display: 'flex', gap: 12, justifyContent: 'center' },
  btnYes: { flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  btnNo: { flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(156,163,175,0.2)', background: 'transparent', color: '#a3a3a3', cursor: 'pointer' },
  botLink: { display: 'inline-block', padding: '12px 20px', borderRadius: 12, background: '#2563eb', color: 'white', textDecoration: 'none', fontWeight: '600', fontSize: 14, marginTop: 8 },
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
  offlineText: { fontSize: 14, color: '#9ca3af' },
  leaderboardModal: { background: '#141414', border: '1px solid rgba(156,163,175,0.15)', borderRadius: 20, padding: 20, maxWidth: '95%', width: 360, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  leaderboardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(156,163,175,0.1)' },
  leaderboardTitle: { fontSize: 20, fontWeight: 'bold', color: '#e5e5e5', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#737373', fontSize: 24, cursor: 'pointer', padding: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  leaderboardList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
  leaderboardItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(38,38,38,0.4)', borderRadius: 12, border: '1px solid rgba(156,163,175,0.1)' },
  rank: { fontSize: 18, fontWeight: 'bold', color: '#737373', width: 28, textAlign: 'center' },
  rank1: { color: '#fbbf24', fontSize: 20 },
  rank2: { color: '#94a3b8', fontSize: 20 },
  rank3: { color: '#b45309', fontSize: 20 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '500', color: '#e5e5e5', display: 'block' },
  playerIncome: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  leaderboardHint: { fontSize: 11, color: '#525252', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  loadingText: { textAlign: 'center', color: '#737373', padding: 32 },
  emptyText: { textAlign: 'center', color: '#525252', padding: 32, fontSize: 14 }
};

export default App;