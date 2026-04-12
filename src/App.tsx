import React, { useState, useEffect, useMemo, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { Handshake, MessageCircle, Crown, Pencil, Check, X, Trophy, Search, UserPlus, ArrowLeft, Trash2, ScrollText, Banknote, Repeat, Gem, ChevronRight } from 'lucide-react';
import { Auth } from './components/Auth';
import { GPU } from './components/GPU';
import { TopMenu } from './components/TopMenu';
import { Settings } from './components/Settings';
import { Shop } from './components/Shop';
import { CurrencySelector } from './components/CurrencySelector';
import { Search as SearchComponent } from './components/Search';
import { Referral } from './components/Referral';
import { ProfileModal } from './components/ProfileModal';
import { TransferModal } from './components/TransferModal';
import { ExchangeModal } from './components/ExchangeModal'; // 👈 Импорт обменника
import type { OwnedCurrency } from './types';
import { currencies } from './data/currencies';
import { getLevelInfo, getGlobalMultiplier } from './data/levels';
import { supabase } from './lib/supabase';

function App() {
  let userIdNum: number;
  try {
    if (WebApp?.initDataUnsafe?.user?.id) userIdNum = Number(WebApp.initDataUnsafe.user.id);
    else {
      const saved = localStorage.getItem('cryptoNexus_guestId');
      userIdNum = saved ? Number(saved) : Math.floor(Date.now() + Math.random() * 100000);
      localStorage.setItem('cryptoNexus_guestId', userIdNum.toString());
    }
  } catch { userIdNum = Number(localStorage.getItem('cryptoNexus_guestId')) || Math.floor(Date.now() + Math.random() * 100000); }

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('cryptoNexus_nickname'));
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [showOfflineEarnings, setShowOfflineEarnings] = useState(false);
  const [offlineAmount, setOfflineAmount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // 💰 Балансы
  const [balance, setBalance] = useState(100);
  const [rubBalance, setRubBalance] = useState(0); // 👈 Рубли
  const [maxBalance, setMaxBalance] = useState(100);
  const [ownedCurrencies, setOwnedCurrencies] = useState<OwnedCurrency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('btc');
  const [priceMultipliers, setPriceMultipliers] = useState<Record<string, number>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [referralBonusGiven, setReferralBonusGiven] = useState(false);
  const [referrerId, setReferrerId] = useState<number | null>(null);

  //  Модалки
  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  const [showClan, setShowClan] = useState(false);
  const [showClanHub, setShowClanHub] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showCreateClan, setShowCreateClan] = useState(false);
  const [showClanSettings, setShowClanSettings] = useState(false);
  const [showRankManager, setShowRankManager] = useState(false);
  const [showFindClan, setShowFindClan] = useState(false);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showExchange, setShowExchange] = useState(false); // 👈 Обмен валют
  
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState<any[]>([]);
  const [clanSearchQuery, setClanSearchQuery] = useState('');
  const [clanSearchResults, setClanSearchResults] = useState<any[]>([]);
  const [selectedForRank, setSelectedForRank] = useState<number[]>([]);
  const [newRank, setNewRank] = useState(1);

  const [myClan, setMyClan] = useState<any>(null);
  const [myClanRole, setMyClanRole] = useState<number>(0);
  const [clanMembers, setClanMembers] = useState<any[]>([]);
  const [clanApplications, setClanApplications] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const [currentScreen, setCurrentScreen] = useState<'main' | 'secondary'>('main');

  // 👆 Свайпы
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentScreen === 'main') setCurrentScreen('secondary');
    if (isRightSwipe && currentScreen === 'secondary') setCurrentScreen('main');

    touchStart.current = null;
    touchEnd.current = null;
  };

  const currentNickname = localStorage.getItem('cryptoNexus_nickname') || `Player${String(userIdNum).slice(-4)}`;
  const { level, progress, tier } = getLevelInfo(maxBalance);
  const globalMultiplier = getGlobalMultiplier(tier);
  const totalIncome = useMemo(() => ownedCurrencies.reduce((t, o) => { const c = currencies.find(cur => cur.id === o.currencyId); return t + (c ? c.incomePerSecond * o.amount * globalMultiplier : 0); }, 0), [ownedCurrencies, globalMultiplier]);

  const saveNicknameToDB = async () => {
    try {
      const { data } = await supabase.from('users').select('nickname').eq('id', userIdNum).single();
      if (!data?.nickname || data.nickname !== currentNickname) {
        await supabase.from('users').upsert({ id: userIdNum, nickname: currentNickname }, { onConflict: 'id' });
      }
    } catch {}
  };

  const saveProgress = async () => {
    if (isLoading) return;
    try {
      await supabase.from('users').upsert({
        id: userIdNum, nickname: currentNickname, balance, rub_balance: rubBalance, max_balance: maxBalance,
        owned_currencies: ownedCurrencies, price_multipliers: priceMultipliers,
        selected_currency: selectedCurrencyId, last_login: new Date().toISOString(),
        total_spent: totalSpent, referrer_id: referrerId, referral_bonus_awarded: referralBonusGiven
      }, { onConflict: 'id' });
    } catch {}
  };

  const calculateIncome = (userData: any) => {
    if (!userData?.owned_currencies?.length) return 0;
    const tier = getLevelInfo(userData.max_balance || 0).tier;
    const mult = getGlobalMultiplier(tier);
    return userData.owned_currencies.reduce((t: number, o: any) => {
      const c = currencies.find(cur => cur.id === o.currencyId);
      return t + (c ? c.incomePerSecond * o.amount * mult : 0);
    }, 0) * 60;
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, nickname, owned_currencies, max_balance, custom_avatar_url, first_login, created_at');
      if (error) throw error;
      const sorted = (data || [])
        .map((u: any) => ({
          id: u.id, nickname: u.nickname || `Player${String(u.id).slice(-4)}`,
          incomePerMin: calculateIncome(u), avatarUrl: u.custom_avatar_url,
          first_login: u.first_login, created_at: u.created_at, max_balance: u.max_balance
        }))
        .sort((a, b) => b.incomePerMin - a.incomePerMin)
        .slice(0, 10);
      setLeaderboard(sorted);
    } catch (err) { console.error('Leaderboard error:', err); }
  };

  const fetchClanData = async () => {
    if (!isAuthenticated) return;
    const { data: member } = await supabase.from('clan_members').select('clan_id, role').eq('user_id', userIdNum).single();
    if (member) {
      const { data: clan } = await supabase.from('clans').select('*').eq('id', member.clan_id).single();
      if (clan) {
        const { data: members } = await supabase.from('clan_members').select('user_id, role').eq('clan_id', clan.id).order('role', { ascending: false });
        const enrichedMembers = await Promise.all((members || []).map(async (m: any) => {
          const { data: u } = await supabase.from('users').select('id, nickname, owned_currencies, max_balance, first_login, custom_avatar_url').eq('id', m.user_id).single();
          return { ...m, ...u, incomePerMin: calculateIncome(u) };
        }));
        const totalInc = enrichedMembers.reduce((s: number, m: any) => s + m.incomePerMin, 0);
        setMyClan({ ...clan, total_income: totalInc });
        setClanMembers(enrichedMembers);
        setMyClanRole(member.role);
      } else { setMyClan(null); setClanMembers([]); setMyClanRole(0); }
    } else { setMyClan(null); setClanMembers([]); setMyClanRole(0); }
  };

  const fetchFriendsData = async () => {
    if (!isAuthenticated) return;
    const { data: reqs } = await supabase.from('friend_requests').select('*').or(`sender_id.eq.${userIdNum},receiver_id.eq.${userIdNum}`).eq('status', 'pending');
    const incoming = (reqs || []).filter((r: any) => r.receiver_id === userIdNum);
    setMessages(incoming.map((r: any) => ({ ...r, type: 'friend', sender_nickname: 'Пользователь' })));

    const { data: accepted } = await supabase.from('friend_requests').select('*').or(`sender_id.eq.${userIdNum},receiver_id.eq.${userIdNum}`).eq('status', 'accepted');
    const friendIds = (accepted || []).map((r: any) => r.sender_id === userIdNum ? r.receiver_id : r.sender_id);
    const friendsData = await Promise.all(friendIds.map(async (id: number) => {
      const { data: u } = await supabase.from('users').select('id, nickname, owned_currencies, max_balance, first_login, custom_avatar_url').eq('id', id).single();
      return { ...u, incomePerMin: calculateIncome(u) };
    }));
    setFriends(friendsData);
  };

  const loadSocial = async () => {
    await Promise.all([fetchClanData(), fetchFriendsData(), fetchLeaderboard()]);
  };

  useEffect(() => { if (isAuthenticated) loadSocial(); }, [isAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated) return;
    saveNicknameToDB();
    const i = setInterval(loadSocial, 15 * 60 * 1000);
    return () => clearInterval(i);
  }, [isAuthenticated]);

  useEffect(() => {
    async function loadProgress() {
      try {
        const { data } = await supabase.from('users').select('*').eq('id', userIdNum).single();
        if (data) {
          setBalance(data.balance || 100); setRubBalance(data.rub_balance || 0); setMaxBalance(data.max_balance || 100);
          setOwnedCurrencies(data.owned_currencies || []); setPriceMultipliers(data.price_multipliers || {});
          setSelectedCurrencyId(data.selected_currency || 'btc'); setTotalSpent(data.total_spent || 0);
          setReferrerId(data.referrer_id || null); setReferralBonusGiven(data.referral_bonus_awarded || false);
          if (data.custom_avatar_url) setAvatarUrl(`${data.custom_avatar_url}?t=${Date.now()}`);
          else if (WebApp.initDataUnsafe?.user?.photo_url) setAvatarUrl(WebApp.initDataUnsafe.user.photo_url);
          else setAvatarUrl(null);

          if (data.last_login && data.owned_currencies?.length > 0) {
            const diff = Math.floor((Date.now() - new Date(data.last_login).getTime()) / 1000);
            if (diff > 0) {
              const inc = data.owned_currencies.reduce((t: number, o: OwnedCurrency) => {
                const c = currencies.find(cur => cur.id === o.currencyId);
                return t + (c ? c.incomePerSecond * o.amount * getGlobalMultiplier(getLevelInfo(data.max_balance || 100).tier) : 0);
              }, 0);
              const off = inc * diff * 0.2;
              if (off > 0) { setOfflineAmount(off); setBalance(p => p + off); setShowOfflineEarnings(true); setTimeout(() => setShowOfflineEarnings(false), 5000); }
            }
          }
        }
      } catch {} finally { setIsLoading(false); }
    }
    loadProgress();
  }, [userIdNum]);

  useEffect(() => { if (isLoading) return; const i = setInterval(saveProgress, 15000); return () => clearInterval(i); }, [isLoading, balance, rubBalance, maxBalance, ownedCurrencies, priceMultipliers, selectedCurrencyId, totalSpent]);
  useEffect(() => { if (isLoading) return; const h = () => document.hidden && saveProgress(); document.addEventListener('visibilitychange', h); return () => document.removeEventListener('visibilitychange', h); }, [isLoading, balance, rubBalance, maxBalance, ownedCurrencies, priceMultipliers, selectedCurrencyId, totalSpent]);
  useEffect(() => { try { if (WebApp?.ready) { WebApp.ready(); WebApp.expand(); } } catch {} document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); }, [isDark]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    const i = setInterval(() => {
      if (totalIncome > 0) {
        setBalance(p => { const n = p + totalIncome; setMaxBalance(m => Math.max(m, n)); return n; });
      }
    }, 1000);
    return () => clearInterval(i);
  }, [isAuthenticated, totalIncome, isLoading]);

  const handleAuthComplete = (nickname: string, refId?: number | null) => {
    localStorage.setItem('cryptoNexus_nickname', nickname);
    if (refId && refId !== userIdNum) setReferrerId(refId);
    setIsAuthenticated(true);
    setTimeout(() => { saveNicknameToDB(); saveProgress(); }, 500);
  };

  const handleBuy = (currencyId: string, amount: number) => {
    const base = currencies.find(c => c.id === currencyId); if (!base) return;
    const mult = priceMultipliers[currencyId] || 1; const price = base.price * mult * amount;
    if (balance >= price) {
      setBalance(p => p - price); setTotalSpent(p => p + price);
      setOwnedCurrencies(prev => { const ex = prev.find(c => c.currencyId === currencyId); return ex ? prev.map(c => c.currencyId === currencyId ? {...c, amount: c.amount + amount} : c) : [...prev, {currencyId, amount}]; });
      setPriceMultipliers(prev => ({...prev, [currencyId]: mult * 1.15}));
      if (!ownedCurrencies.find(c => c.currencyId === currencyId)) setSelectedCurrencyId(currencyId);
      const newTotal = totalSpent + price;
      if (newTotal >= 50 && referrerId && !referralBonusGiven) {
        setReferralBonusGiven(true);
        supabase.from('users').select('balance').eq('id', referrerId).single().then(({data}) => { if(data) supabase.from('users').update({balance: (data.balance || 0) + 1000}).eq('id', referrerId); });
      }
      setTimeout(() => saveProgress(), 100);
    }
  };

  const handleCreateClan = async (clanData: any) => {
    if (myClan) { alert('Вы уже находитесь в клане!'); setShowCreateClan(false); return; }
    if (balance < 100000) return alert('Нужно $100,000!');
    setBalance(p => p - 100000);
    const { data, error } = await supabase.from('clans').insert({ 
      name: clanData.name, emoji: clanData.emoji, description: clanData.description,
      min_level: clanData.minLevel, max_members: clanData.maxMembers, creator_id: userIdNum, 
      total_income: 0, require_approval: clanData.requireApproval
    }).select().single();
    if (error) { console.error('Clan creation error:', error); return alert('Ошибка при создании клана: ' + error.message); }
    if (data) {
      await supabase.from('clan_members').insert({ clan_id: data.id, user_id: userIdNum, role: 4 });
      setShowCreateClan(false); setShowClanHub(false); fetchClanData();
    }
  };

  const handleUpdateClan = async (clanData: any) => {
    if (!myClan) return;
    await supabase.from('clans').update({ 
      name: clanData.name, description: clanData.description, min_level: clanData.minLevel, 
      max_members: clanData.maxMembers, require_approval: clanData.requireApproval
    }).eq('id', myClan.id);
    setShowClanSettings(false); fetchClanData();
  };

  const handleDeleteClan = async () => {
    if (!myClan) return;
    try {
      await supabase.from('clan_members').delete().eq('clan_id', myClan.id);
      await supabase.from('clan_applications').delete().eq('clan_id', myClan.id);
      const { error } = await supabase.from('clans').delete().eq('id', myClan.id);
      if (error) throw error;
      setMyClan(null); setClanMembers([]); setClanApplications([]); setMyClanRole(0);
      setShowClanSettings(false); setShowClan(false);
      alert('Клан успешно удален');
    } catch (err) { console.error('Delete clan error:', err); alert('Ошибка при удалении клана'); }
  };

  const handleAppResponse = async (appId: number, accept: boolean) => {
    await supabase.from('clan_applications').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', appId);
    if (accept) {
      const app = clanApplications.find(a => a.id === appId);
      if (app) await supabase.from('clan_members').insert({ clan_id: myClan.id, user_id: app.user_id, role: 1 });
    }
    fetchClanData();
  };

  const handleKick = async (userId: number) => {
    if (!confirm('Исключить игрока?')) return;
    await supabase.from('clan_members').delete().eq('clan_id', myClan.id).eq('user_id', userId);
    fetchClanData();
  };

  const handleRankUpdate = async () => {
    for (const uid of selectedForRank) {
      await supabase.from('clan_members').update({ role: newRank }).eq('clan_id', myClan.id).eq('user_id', uid);
    }
    setShowRankManager(false); setSelectedForRank([]); fetchClanData();
  };

  const handleAddFriend = async (targetId: number) => {
    await supabase.from('friend_requests').insert({ sender_id: userIdNum, receiver_id: targetId, status: 'pending' });
    alert('Заявка отправлена!'); setShowProfile(false); setShowFriendSearch(false);
  };

  const handleRemoveFriend = async (targetId: number) => {
    await supabase.from('friend_requests').update({ status: 'rejected' }).or(`and(sender_id.eq.${userIdNum},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${userIdNum})`);
    fetchFriendsData(); setShowProfile(false);
  };

  const handleFriendResponse = async (reqId: number, accept: boolean) => {
    await supabase.from('friend_requests').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', reqId);
    fetchFriendsData();
  };

  const handleJoinClan = async (clanId: number) => {
    if (myClan) { alert('Вы уже находитесь в клане!'); return; }
    const clan = clanSearchResults.find(c => c.id === clanId);
    if (!clan) return;
    const memberCount = clan.members_count || 0;
    if (memberCount >= clan.max_members) return alert('В клане нет мест');
    if (level < clan.min_level) return alert('Ваш уровень слишком мал');
    try {
      if (clan.require_approval) {
        await supabase.from('clan_applications').insert({ clan_id: clanId, user_id: userIdNum, status: 'pending' });
        alert('Заявка отправлена! Лидер клана должен её одобрить.');
      } else {
        const { error } = await supabase.from('clan_members').insert({ clan_id: clanId, user_id: userIdNum, role: 1 });
        if (error) throw error;
        alert('Вы успешно вступили в клан!');
        setShowFindClan(false); fetchClanData();
      }
    } catch (err) { console.error('Join clan error:', err); alert('Ошибка при вступлении в клан'); }
  };

  const searchFriends = async (query: string) => {
    if (!query.trim()) { setFriendSearchResults([]); return; }
    try {
      const { data, error } = await supabase.from('users').select('id, nickname, owned_currencies, max_balance, custom_avatar_url').ilike('nickname', `%${query}%`).neq('id', userIdNum).limit(10);
      if (error) throw error;
      setFriendSearchResults((data || []).map((u: any) => ({ ...u, incomePerMin: calculateIncome(u) })));
    } catch (err) { console.error('Friend search error:', err); setFriendSearchResults([]); }
  };

  const searchClans = async (query: string) => {
    if (!query.trim()) { setClanSearchResults([]); return; }
    try {
      const { data, error } = await supabase.from('clans').select('*').ilike('name', `%${query}%`).limit(10);
      if (error) throw error;
      const clansWithCount = await Promise.all((data || []).map(async (clan: any) => {
        const { count } = await supabase.from('clan_members').select('*', { count: 'exact', head: true }).eq('clan_id', clan.id);
        return { ...clan, members_count: count || 0 };
      }));
      setClanSearchResults(clansWithCount);
    } catch (err) { console.error('Clan search error:', err); setClanSearchResults([]); }
  };

  const openProfile = (user: any) => { 
    setSelectedUser({ ...user, avatarUrl: user.custom_avatar_url, level: getLevelInfo(user.max_balance || 0).level }); 
    setShowProfile(true); 
  };

  const getFontSize = (text: string) => text.length > 15 ? '14px' : text.length > 10 ? '16px' : '20px';

  const renderClanMenu = () => {
    if (myClan && !showClanHub) {
      return (
        <>
          <div style={styles.clanHeader}>
            <div style={styles.clanAvatar}>{myClan.emoji}</div>
            <div style={{flex:1}}>
              <h3 style={{...styles.clanName, fontSize: getFontSize(myClan.name)}}>{myClan.name}</h3>
              <p style={styles.clanIncome}>Общий доход: +${myClan.total_income.toFixed(2)}/мин</p>
              {myClan.description && <p style={styles.clanDescription}>{myClan.description}</p>}
            </div>
            {myClanRole === 4 && (
              <div style={{display:'flex', gap:8}}>
                <button onClick={() => setShowClanSettings(true)} style={styles.iconBtn}><Pencil size={18} /></button>
                <button onClick={() => setShowRankManager(true)} style={styles.iconBtn}><Crown size={18} /></button>
                <button onClick={() => setShowMessages(true)} style={{...styles.iconBtn, position:'relative'}}>
                  <MessageCircle size={18} />
                  {clanApplications.length > 0 && <span style={styles.badge}>{clanApplications.length}</span>}
                </button>
              </div>
            )}
          </div>
          <div style={styles.memberList}>
            {clanMembers.sort((a,b) => b.role - a.role).map(m => (
              <div key={m.user_id} style={styles.memberItem} onClick={() => openProfile(m)}>
                <div style={styles.memberAvatar}>{m.custom_avatar_url ? <img src={m.custom_avatar_url} style={styles.memberImg} /> : m.nickname[0]}</div>
                <div style={{flex:1}}>
                  <div style={styles.memberName}>{m.nickname}</div>
                  <div style={styles.memberRole}>{['', 'Участник', 'Фармила', 'Заместитель', 'Создатель'][m.role]}</div>
                </div>
                <div style={styles.memberIncome}>+${m.incomePerMin.toFixed(0)}/м</div>
              </div>
            ))}
          </div>
          <div style={{marginTop: 16}}>
             <button onClick={() => setShowClanHub(true)} style={{...styles.btnSecondary, width: '100%'}}>
               <ArrowLeft size={16} style={{marginRight: 8}}/> Назад
             </button>
          </div>
        </>
      );
    }
    return (
      <>
        <h2 style={styles.modalTitle}>Кланы</h2>
        {myClan && <p style={{color: '#ef4444', textAlign: 'center', marginBottom: 12, fontSize: 13}}>Вы уже в клане "{myClan.name}"</p>}
        <button onClick={() => { if (myClan) alert('Вы уже находитесь в клане!'); else setShowCreateClan(true); }} style={styles.btnPrimary}>Создать клан ($100,000)</button>
        <button onClick={() => setShowFindClan(true)} style={styles.btnSecondary}>Найти клан</button>
        {myClan && <button onClick={() => setShowClanHub(false)} style={{...styles.btnSecondary, marginTop: 12, width: '100%'}}>Вернуться в мой клан</button>}
      </>
    );
  };

  // Функция для обработки обмена валют
  const handleExchange = (usdChange: number, rubChange: number) => {
    setBalance(prev => prev + usdChange);
    setRubBalance(prev => prev + rubChange);
    saveProgress();
  };

  if (isLoading) return <div style={{color:'white', textAlign:'center', marginTop:'50vh'}}>Загрузка...</div>;
  if (!isAuthenticated) return <Auth onComplete={handleAuthComplete} />;

  return (
    <>
      <div 
        style={styles.container}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{
          ...styles.sliderWrapper,
          transform: currentScreen === 'secondary' ? 'translateX(-100vw)' : 'translateX(0)'
        }}>
          
          {/* --- ЭКРАН 1: ГЛАВНАЯ --- */}
          <div style={styles.screen}>
            <div style={styles.levelBar}><span style={styles.levelText}>Lvl {level}</span><div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${progress}%` }}></div></div><span style={styles.levelText}>{level === 30 ? 'MAX' : `Lvl ${level + 1}`}</span></div>

            <div style={styles.topBar}>
              <div style={styles.userSection} onClick={() => openProfile({ id: userIdNum, nickname: currentNickname, incomePerMin: totalIncome, first_login: new Date().toISOString(), custom_avatar_url: avatarUrl, max_balance: maxBalance })}>
                <div style={styles.avatarWrapper}>{avatarUrl ? <img src={avatarUrl} style={styles.avatarImg} /> : <span style={styles.avatarText}>{currentNickname[0].toUpperCase()}</span>}</div>
                <div style={styles.userInfo}>
                  <span style={styles.nickname}>{currentNickname} <span style={styles.levelBadge}>Lvl {level}</span></span>
                  <div style={styles.balances}>
                    <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: 15 }}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    {/* 👈 Отображение рублей */}
                    <span style={{ fontSize: 12, color: '#a3a3a3', background: 'rgba(156,163,175,0.1)', padding: '2px 8px', borderRadius: 6 }}>₽{rubBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(156,163,175,0.1)', padding: '2px 8px', borderRadius: 6 }}>x{globalMultiplier.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <div style={styles.rightMenuContainer}><TopMenu onSettingsClick={() => setShowSettings(true)} onClanClick={() => { setShowClan(true); setShowClanHub(false); }} onFriendsClick={() => setShowFriends(true)} onShopClick={() => setShowShop(true)} onSearchClick={() => setShowSearch(true)} /></div>
            </div>
            
            <div style={styles.leftButtons}>
              <button onClick={() => setShowMessages(true)} style={styles.leftBtn}>
                <MessageCircle size={20} color="var(--text-primary)" />
                {(messages.length + (myClanRole === 4 ? clanApplications.length : 0)) > 0 && <span style={styles.badge}>{messages.length + (myClanRole === 4 ? clanApplications.length : 0)}</span>}
              </button>
              <button onClick={() => setShowLeaderboard(true)} style={styles.leftBtn}><Trophy size={20} color="var(--text-primary)" /></button>
              <button onClick={() => setShowReferral(true)} style={styles.leftBtn}><Handshake size={20} color="var(--text-primary)" /></button>
            </div>

            <div style={styles.center}>
              <GPU tier={level} isMining={totalIncome > 0} />
              <div style={styles.incomeDisplay}>+${(totalIncome * 60).toFixed(2)}/мин</div>
            </div>
            
            <div style={styles.bottomBar}>
              <div style={styles.bottomSection}></div>
              <button onClick={() => setShowCurrencySelector(true)} style={styles.currencyBtn}><span style={styles.currencyName}>{currencies.find(c => c.id === selectedCurrencyId)?.shortName || 'USD'}</span><span style={styles.arrow}>▼</span></button>
              <div style={styles.bottomSection}></div>
            </div>
          </div>

          {/* --- ЭКРАН 2: МЕНЮ --- */}
          <div style={styles.screen}>
            <div style={styles.secondaryMenuHeader}>
              <h2 style={{margin: 0, fontSize: 24, fontWeight: 'bold', color: '#fff'}}>Меню</h2>
              <span style={{color: '#737373', fontSize: 14}}>Проведи пальцем вправо для возврата</span>
            </div>

            <div style={styles.menuGrid}>
              <button style={styles.menuCard} onClick={() => alert('Квесты скоро!')}>
                <div style={{...styles.iconCircle, background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6'}}><ScrollText size={28} /></div>
                <span style={styles.menuCardTitle}>Квесты</span>
                <span style={styles.menuCardSub}>Ежедневные задания</span>
                <ChevronRight size={20} color="#52525b" style={{position:'absolute', right: 16}} />
              </button>

              <button style={styles.menuCard} onClick={() => setShowTransfer(true)}>
                <div style={{...styles.iconCircle, background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e'}}><Banknote size={28} /></div>
                <span style={styles.menuCardTitle}>Перевод</span>
                <span style={styles.menuCardSub}>Отправить другу</span>
                <ChevronRight size={20} color="#52525b" style={{position:'absolute', right: 16}} />
              </button>

              {/* 👈 Кнопка Обмен */}
              <button style={styles.menuCard} onClick={() => setShowExchange(true)}>
                <div style={{...styles.iconCircle, background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7'}}><Repeat size={28} /></div>
                <span style={styles.menuCardTitle}>Обмен</span>
                <span style={styles.menuCardSub}>USD ↔ RUB</span>
                <ChevronRight size={20} color="#52525b" style={{position:'absolute', right: 16}} />
              </button>

              <button style={styles.menuCard} onClick={() => alert('Донат скоро!')}>
                <div style={{...styles.iconCircle, background: 'rgba(234, 179, 8, 0.2)', color: '#eab308'}}><Gem size={28} /></div>
                <span style={styles.menuCardTitle}>Донат</span>
                <span style={styles.menuCardSub}>Премиум функции</span>
                <ChevronRight size={20} color="#52525b" style={{position:'absolute', right: 16}} />
              </button>
            </div>
          </div>

        </div>

        {/* --- МОДАЛКИ --- */}
        <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} musicVolume={50} sfxVolume={50} isDark={isDark} onThemeToggle={() => setIsDark(!isDark)} onSave={() => {}} />
        <Shop isOpen={showShop} onClose={() => setShowShop(false)} balance={balance} priceMultipliers={priceMultipliers} onBuy={handleBuy} />
        <CurrencySelector isOpen={showCurrencySelector} onClose={() => setShowCurrencySelector(false)} ownedCurrencies={ownedCurrencies} selectedCurrency={selectedCurrencyId} onSelect={setSelectedCurrencyId} />
        <SearchComponent isOpen={showSearch} onClose={() => setShowSearch(false)} balance={balance} priceMultipliers={priceMultipliers} onBuy={handleBuy} />
        <Referral isOpen={showReferral} onClose={() => setShowReferral(false)} currentUserId={userIdNum} />
        <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} user={selectedUser} currentUserId={userIdNum} isFriend={friends.some(f => f.id === selectedUser?.id)} isInSameClan={!!myClan && clanMembers.some(m => m.user_id === selectedUser?.id)} myRole={myClanRole} onAddFriend={handleAddFriend} onRemoveFriend={handleRemoveFriend} onKick={handleKick} friends={friends} />

        {showLeaderboard && (<div style={styles.overlay} onClick={() => setShowLeaderboard(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><button onClick={() => setShowLeaderboard(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button><h2 style={styles.modalTitle}>🏆 Топ игроков</h2><div style={styles.list}>{leaderboard.map((player, index) => (<div key={player.id} style={styles.leaderboardItem} onClick={() => openProfile(player)}><span style={{...styles.rank, ...(index < 3 ? styles.topRank : {})}}>{index + 1}</span><div style={styles.listAvatar}>{player.avatarUrl ? <img src={player.avatarUrl} style={styles.memberImg} /> : player.nickname[0]}</div><div style={{flex:1}}><div style={styles.listName}>{player.nickname}</div><div style={styles.listSub}>+${player.incomePerMin.toFixed(0)}/мин</div></div></div>))}</div></div></div>)}
        {showClan && (<div style={styles.overlay} onClick={() => setShowClan(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><button onClick={() => setShowClan(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>{renderClanMenu()}</div></div>)}
        {showFriends && (<div style={styles.overlay} onClick={() => setShowFriends(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><button onClick={() => setShowFriends(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button><h2 style={styles.modalTitle}>Друзья</h2><button onClick={() => setShowFriendSearch(true)} style={styles.btnSecondary}><Search size={16} /> Поиск друзей</button><div style={styles.list}>{friends.length === 0 ? <p style={{textAlign:'center', color:'#737373'}}>Список друзей пуст</p> : friends.map(f => (<div key={f.id} style={styles.listItem} onClick={() => openProfile(f)}><div style={styles.listAvatar}>{f.custom_avatar_url ? <img src={f.custom_avatar_url} style={styles.memberImg} /> : f.nickname[0]}</div><div style={{flex:1}}><div style={styles.listName}>{f.nickname}</div><div style={styles.listSub}>+${f.incomePerMin.toFixed(0)}/мин</div></div></div>))}</div></div></div>)}
        {showFriendSearch && (<div style={styles.overlay} onClick={() => setShowFriendSearch(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><button onClick={() => setShowFriendSearch(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button><h2 style={styles.modalTitle}>Поиск друзей</h2><input placeholder="Введите никнейм..." value={friendSearchQuery} onChange={(e) => { setFriendSearchQuery(e.target.value); searchFriends(e.target.value); }} style={styles.input} autoFocus /><div style={styles.list}>{friendSearchResults.length === 0 ? <p style={{textAlign:'center', color:'#737373'}}>Введите имя для поиска</p> : friendSearchResults.map(f => (<div key={f.id} style={styles.listItem}><div style={styles.listAvatar}>{f.custom_avatar_url ? <img src={f.custom_avatar_url} style={styles.memberImg} /> : f.nickname[0]}</div><div style={{flex:1}}><div style={styles.listName}>{f.nickname}</div><div style={styles.listSub}>+${f.incomePerMin.toFixed(0)}/мин</div></div><button onClick={() => handleAddFriend(f.id)} style={styles.btnSmall}><UserPlus size={16} /></button></div>))}</div></div></div>)}
        {showMessages && (<div style={styles.overlay} onClick={() => setShowMessages(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><button onClick={() => setShowMessages(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button><h2 style={styles.modalTitle}>Сообщения</h2><div style={styles.list}>{messages.length === 0 ? <p style={{textAlign:'center', color:'#737373'}}>Нет заявок</p> : messages.map((msg: any) => (<div key={msg.id} style={styles.listItem}><div style={{flex:1}}><div style={styles.listName}>{msg.type === 'friend' ? 'Заявка в друзья' : 'Заявка в клан'}</div><div style={styles.listSub}>От: {msg.sender_nickname || msg.nickname}</div></div><div style={{display:'flex', gap:8}}><button onClick={() => msg.type === 'friend' ? handleFriendResponse(msg.id, true) : handleAppResponse(msg.id, true)} style={styles.btnYes}><Check size={16} /></button><button onClick={() => msg.type === 'friend' ? handleFriendResponse(msg.id, false) : handleAppResponse(msg.id, false)} style={styles.btnNo}><X size={16} /></button></div></div>))}</div></div></div>)}
        {showCreateClan && (<div style={styles.overlay} onClick={() => setShowCreateClan(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><h3 style={styles.modalTitle}>Создать клан</h3><input id="clanName" placeholder="Название (до 25)" maxLength={25} style={styles.input} /><textarea id="clanDesc" placeholder="Описание (до 200)" maxLength={200} style={{...styles.input, height: 60, resize: 'none'}} /><label style={styles.label}><input type="checkbox" id="requireApproval" /> Вступление по заявке</label><label style={styles.label}>Мин. уровень: <input type="number" id="minLevel" min={1} max={30} defaultValue={1} style={{width: 40, background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4, padding: 2}} /></label><label style={styles.label}>Макс. участников: <input type="number" id="maxMembers" min={5} max={1000} defaultValue={50} style={{width: 60, background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4, padding: 2}} /></label><div style={{display:'flex', gap:8, marginTop: 12}}><button onClick={() => setShowCreateClan(false)} style={styles.btnSecondary}>Отменить</button><button onClick={() => { const name = (document.getElementById('clanName') as HTMLInputElement).value; const description = (document.getElementById('clanDesc') as HTMLTextAreaElement).value; const requireApproval = (document.getElementById('requireApproval') as HTMLInputElement).checked; const minLevel = parseInt((document.getElementById('minLevel') as HTMLInputElement).value); const maxMembers = parseInt((document.getElementById('maxMembers') as HTMLInputElement).value); handleCreateClan({ name, emoji: '🏰', description, requireApproval, minLevel, maxMembers }); }} style={styles.btnPrimary}>Создать</button></div></div></div>)}
        {showClanSettings && myClan && (<div style={styles.overlay} onClick={() => setShowClanSettings(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><h3 style={styles.modalTitle}>Настройки клана</h3><label style={styles.label}>Название клана:<input id="editClanName" defaultValue={myClan.name} placeholder="Название (до 25)" maxLength={25} style={{...styles.input, marginTop: 8}} /></label><textarea id="editClanDesc" defaultValue={myClan.description || ''} placeholder="Описание (до 200)" maxLength={200} style={{...styles.input, height: 60, resize: 'none'}} /><label style={styles.label}><input type="checkbox" id="editRequireApproval" defaultChecked={myClan.require_approval} /> Вступление по заявке</label><label style={styles.label}>Мин. уровень: <input type="number" id="editMinLevel" defaultValue={myClan.min_level} min={1} max={30} style={{width: 40, background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4, padding: 2}} /></label><label style={styles.label}>Макс. участников: <input type="number" id="editMaxMembers" defaultValue={myClan.max_members} min={5} max={1000} style={{width: 60, background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4, padding: 2}} /></label><div style={{display:'flex', gap:8, marginTop: 12}}><button onClick={() => setShowClanSettings(false)} style={styles.btnSecondary}>Отменить</button><button onClick={() => { const name = (document.getElementById('editClanName') as HTMLInputElement).value; const description = (document.getElementById('editClanDesc') as HTMLTextAreaElement).value; const requireApproval = (document.getElementById('editRequireApproval') as HTMLInputElement).checked; const minLevel = parseInt((document.getElementById('editMinLevel') as HTMLInputElement).value); const maxMembers = parseInt((document.getElementById('editMaxMembers') as HTMLInputElement).value); handleUpdateClan({ name, description, requireApproval, minLevel, maxMembers }); }} style={styles.btnPrimary}>Сохранить</button></div><div style={{marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(239, 68, 68, 0.3)'}}><button onClick={() => { if (confirm('⚠️ ВНИМАНИЕ! Удалить клан навсегда? Все участники будут исключены.')) handleDeleteClan(); }} style={styles.btnDanger}><Trash2 size={16} style={{display: 'inline', marginRight: 8, verticalAlign: 'middle'}}/> Удалить клан</button></div></div></div>)}
        {showRankManager && (<div style={styles.overlay} onClick={() => setShowRankManager(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><h3 style={styles.modalTitle}>Управление рангами</h3><div style={styles.memberList}>{clanMembers.filter(m => m.role < 4).map(m => (<div key={m.user_id} style={styles.memberItem}><input type="checkbox" checked={selectedForRank.includes(m.user_id)} onChange={(e) => { if (e.target.checked) setSelectedForRank([...selectedForRank, m.user_id]); else setSelectedForRank(selectedForRank.filter(id => id !== m.user_id)); }} style={{width: 20, height: 20, marginRight: 12}} /><div style={styles.memberAvatar}>{m.custom_avatar_url ? <img src={m.custom_avatar_url} style={styles.memberImg} /> : m.nickname[0]}</div><div style={{flex:1}}><div style={styles.memberName}>{m.nickname}</div><div style={styles.memberRole}>{['', 'Участник', 'Фармила', 'Заместитель', 'Создатель'][m.role]}</div></div></div>))}</div><div style={{marginTop: 16}}><label style={styles.label}>Новый ранг: <select value={newRank} onChange={(e) => setNewRank(parseInt(e.target.value))} style={{marginLeft: 8, padding: '4px 8px', background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4}}><option value={1}>1 - Участник</option><option value={2}>2 - Фармила</option><option value={3}>3 - Заместитель</option></select></label></div><div style={{display:'flex', gap:8, marginTop: 12}}><button onClick={() => { setShowRankManager(false); setSelectedForRank([]); }} style={styles.btnSecondary}>Отменить</button><button onClick={handleRankUpdate} style={styles.btnPrimary}>Сохранить</button></div></div></div>)}
        {showFindClan && (<div style={styles.overlay} onClick={() => setShowFindClan(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><button onClick={() => setShowFindClan(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button><h2 style={styles.modalTitle}>Поиск клана</h2><input placeholder="Введите название клана..." value={clanSearchQuery} onChange={(e) => { setClanSearchQuery(e.target.value); searchClans(e.target.value); }} style={styles.input} autoFocus /><div style={styles.list}>{clanSearchResults.length === 0 ? <p style={{textAlign:'center', color:'#737373'}}>Введите название для поиска</p> : clanSearchResults.map(clan => (<div key={clan.id} style={styles.listItem}><div style={styles.clanAvatar}>{clan.emoji}</div><div style={{flex:1}}><div style={styles.listName}>{clan.name}</div><div style={styles.listSub}>{clan.members_count || 0}/{clan.max_members} участников • Мин. ур: {clan.min_level}</div></div><button onClick={() => handleJoinClan(clan.id)} style={styles.btnSmall}>Вступить</button></div>))}</div></div></div>)}
      </div>

      {/* 🔥 ОФЛАЙН ДОХОД */}
      {showOfflineEarnings && (
        <div style={styles.offlineOverlay}>
          <div style={styles.offlineModal}>
            <button onClick={() => setShowOfflineEarnings(false)} style={styles.closeBtn}>
              <X size={24} color="#9ca3af" />
            </button>
            <div style={styles.offlineIcon}>💰</div>
            <div style={styles.offlineTitle}>Пока тебя не было!</div>
            <div style={{...styles.offlineAmount, fontSize: offlineAmount > 1e9 ? '20px' : offlineAmount > 1e6 ? '28px' : offlineAmount > 1e4 ? '32px' : '36px'}}>
              +${offlineAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={styles.offlineText}>Твои майнеры заработали</div>
          </div>
        </div>
      )}

      {/* 🔥 МОДАЛКИ ПЕРЕВОДА И ОБМЕНА */}
      <TransferModal 
        isOpen={showTransfer} 
        onClose={() => setShowTransfer(false)} 
        currentUserId={userIdNum}
        currentBalance={balance}
        onRefreshBalance={saveProgress} 
      />
      
      <ExchangeModal
        isOpen={showExchange}
        onClose={() => setShowExchange(false)}
        usdBalance={balance}
        rubBalance={rubBalance}
        onExchange={handleExchange}
      />
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { width: '100vw', height: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', transition: 'background 0.3s' },
  sliderWrapper: { display: 'flex', width: '200vw', height: '100%', transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' },
  screen: { width: '100vw', height: '100%', position: 'relative', flexShrink: 0 },
  secondaryMenuHeader: { paddingTop: 60, paddingLeft: 24, paddingRight: 24, marginBottom: 30 },
  menuGrid: { padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  menuCard: { background: 'rgba(38, 38, 38, 0.6)', border: '1px solid rgba(156, 163, 175, 0.1)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  iconCircle: { width: 50, height: 50, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  menuCardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  menuCardSub: { color: '#737373', fontSize: 12 },
  levelBar: { position: 'absolute', top: 12, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 100 },
  levelText: { fontSize: 12, fontWeight: '600', color: 'var(--text-secondary)' },
  progressTrack: { width: 140, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s ease' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, padding: '16px', paddingTop: 40, background: 'linear-gradient(180deg, var(--bg-panel) 0%, transparent 100%)', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' },
  userSection: { display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto', cursor: 'pointer' },
  avatarWrapper: { width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  userInfo: { flex: 1 },
  nickname: { fontSize: 15, fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' },
  levelBadge: { fontSize: 11, color: 'var(--accent)', background: 'rgba(156,163,175,0.1)', padding: '2px 6px', borderRadius: 4, marginLeft: 4 },
  balances: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  rightMenuContainer: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'auto' },
  leftButtons: { position: 'absolute', left: 16, top: 110, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 100 },
  leftBtn: { position: 'relative', width: 44, height: 44, borderRadius: 12, background: 'rgba(38,38,38,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(156,163,175,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.1s' },
  center: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', paddingTop: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  incomeDisplay: { fontSize: 18, fontWeight: 'bold', color: 'var(--success)', marginTop: 16 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg-panel)', padding: '20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', backdropFilter: 'blur(12px)' },
  bottomSection: { flex: 1 },
  currencyBtn: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-primary)' },
  currencyName: { fontSize: 16, fontWeight: 'bold', color: 'var(--accent)' },
  arrow: { fontSize: 10, color: 'var(--text-secondary)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  modal: { background: '#141414', border: '1px solid rgba(156,163,175,0.15)', borderRadius: 20, padding: 24, maxWidth: '95%', width: 380, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' },
  closeBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#e5e5e5', marginBottom: 16, textAlign: 'center' },
  btnPrimary: { flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  btnSecondary: { flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(156,163,175,0.2)', background: 'transparent', color: '#a3a3a3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnSmall: { width: 36, height: 36, borderRadius: 10, background: '#22c55e', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },
  clanHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(156,163,175,0.1)' },
  clanAvatar: { width: 48, height: 48, borderRadius: '50%', background: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 },
  clanName: { fontSize: 18, fontWeight: 'bold', color: '#e5e5e5', margin: 0, lineHeight: 1.2 },
  clanIncome: { fontSize: 13, color: '#22c55e', margin: '4px 0 0 0' },
  clanDescription: { fontSize: 12, color: '#9ca3af', margin: '4px 0 0 0', fontStyle: 'italic', lineHeight: 1.4 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, background: 'rgba(38,38,38,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#a3a3a3', position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 'bold', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #141414' },
  memberList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
  memberItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(38,38,38,0.4)', borderRadius: 12, cursor: 'pointer' },
  memberAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', overflow: 'hidden' },
  memberImg: { width: '100%', height: '100%', objectFit: 'cover' },
  memberName: { fontSize: 14, fontWeight: '500', color: '#e5e5e5' },
  memberRole: { fontSize: 11, color: '#737373' },
  memberIncome: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  list: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 },
  listItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'rgba(38,38,38,0.4)', borderRadius: 10 },
  listAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', overflow: 'hidden' },
  listName: { fontSize: 14, color: '#e5e5e5', fontWeight: '500' },
  listSub: { fontSize: 11, color: '#737373' },
  leaderboardItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'rgba(38,38,38,0.4)', borderRadius: 10, cursor: 'pointer' },
  rank: { fontSize: 18, fontWeight: 'bold', color: '#737373', width: 28, textAlign: 'center' },
  topRank: { color: '#fbbf24', fontSize: 20 },
  input: { width: '100%', padding: '10px', borderRadius: 8, background: '#0a0a0a', border: '1px solid rgba(156,163,175,0.2)', color: 'white', marginBottom: 8, boxSizing: 'border-box' },
  label: { display: 'flex', alignItems: 'flex-start', gap: 8, color: '#a3a3a3', fontSize: 13, marginBottom: 8, flexDirection: 'column' },
  offlineOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  offlineModal: { position: 'relative', background: '#141414', border: '2px solid #22c55e', borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: '0 0 50px rgba(34,197,94,0.4)', minWidth: 280, maxWidth: '90%' },
  offlineIcon: { fontSize: 48, marginBottom: 12 },
  offlineTitle: { fontSize: 22, fontWeight: 'bold', color: '#22c55e', marginBottom: 8 },
  offlineAmount: { fontWeight: 'bold', color: '#4ade80', marginBottom: 8, textShadow: '0 0 20px rgba(74,222,128,0.5)', transition: 'font-size 0.3s ease' },
  offlineText: { fontSize: 14, color: '#9ca3af' },
  btnYes: { background: '#22c55e', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },
  btnNo: { background: '#ef4444', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },
  btnDanger: { padding: '12px', borderRadius: 12, border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default App;