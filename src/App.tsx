import React, { useState, useEffect, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import { Handshake, MessageCircle, Crown, Pencil, Check, X, Trophy, Search, UserPlus } from 'lucide-react';
import { Auth } from './components/Auth';
import { GPU } from './components/GPU';
import { TopMenu } from './components/TopMenu';
import { Settings } from './components/Settings';
import { Shop } from './components/Shop';
import { CurrencySelector } from './components/CurrencySelector';
import { Search as SearchComponent } from './components/Search';
import { Referral } from './components/Referral';
import { ProfileModal } from './components/ProfileModal';
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
  
  const [balance, setBalance] = useState(100);
  const [maxBalance, setMaxBalance] = useState(100);
  const [ownedCurrencies, setOwnedCurrencies] = useState<OwnedCurrency[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState('btc');
  const [priceMultipliers, setPriceMultipliers] = useState<Record<string, number>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [referralBonusGiven, setReferralBonusGiven] = useState(false);
  const [referrerId, setReferrerId] = useState<number | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  const [showClan, setShowClan] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showCreateClan, setShowCreateClan] = useState(false);
  const [showClanSettings, setShowClanSettings] = useState(false);
  const [showRankManager, setShowRankManager] = useState(false);
  const [showFindClan, setShowFindClan] = useState(false);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
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
  const [disableRequests, setDisableRequests] = useState(false);

  const currentNickname = localStorage.getItem('cryptoNexus_nickname') || `Player${String(userIdNum).slice(-4)}`;
  const { level, progress, tier } = getLevelInfo(maxBalance);
  const globalMultiplier = getGlobalMultiplier(tier);
  const totalIncome = useMemo(() => ownedCurrencies.reduce((t, o) => { const c = currencies.find(cur => cur.id === o.currencyId); return t + (c ? c.incomePerSecond * o.amount * globalMultiplier : 0); }, 0), [ownedCurrencies, globalMultiplier]);

  const saveNicknameToDB = async () => {
    try {
      const {  data } = await supabase.from('users').select('nickname, disable_requests').eq('id', userIdNum).single();
      if (!data?.nickname || data.nickname !== currentNickname || data.disable_requests !== disableRequests) {
        await supabase.from('users').upsert({ id: userIdNum, nickname: currentNickname, disable_requests: disableRequests }, { onConflict: 'id' });
      }
    } catch {}
  };

  const saveProgress = async () => {
    if (isLoading) return;
    try {
      await supabase.from('users').upsert({
        id: userIdNum, nickname: currentNickname, balance, max_balance: maxBalance,
        owned_currencies: ownedCurrencies, price_multipliers: priceMultipliers,
        selected_currency: selectedCurrencyId, last_login: new Date().toISOString(),
        total_spent: totalSpent, referrer_id: referrerId, referral_bonus_awarded: referralBonusGiven,
        disable_requests: disableRequests
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
      const {  data, error } = await supabase.from('users').select('id, nickname, owned_currencies, max_balance, custom_avatar_url');
      if (error) throw error;
      const sorted = (data || [])
        .map((u: any) => ({
          id: u.id,
          nickname: u.nickname || `Player${String(u.id).slice(-4)}`,
          incomePerMin: calculateIncome(u),
          avatarUrl: u.custom_avatar_url
        }))
        .sort((a, b) => b.incomePerMin - a.incomePerMin)
        .slice(0, 10);
      setLeaderboard(sorted);
    } catch (err) { console.error('Leaderboard error:', err); }
  };

  const fetchClanData = async () => {
    if (!isAuthenticated) return;
    const {  member } = await supabase.from('clan_members').select('clan_id, role').eq('user_id', userIdNum).single();
    if (member) {
      const {  clan } = await supabase.from('clans').select('*').eq('id', member.clan_id).single();
      if (clan) {
        const {  members } = await supabase.from('clan_members').select('user_id, role').eq('clan_id', clan.id).order('role', { ascending: false });
        const enrichedMembers = await Promise.all((members || []).map(async (m: any) => {
          const {  u } = await supabase.from('users').select('id, nickname, owned_currencies, max_balance, first_login, custom_avatar_url').eq('id', m.user_id).single();
          return { ...m, ...u, incomePerMin: calculateIncome(u) };
        }));
        const totalInc = enrichedMembers.reduce((s: number, m: any) => s + m.incomePerMin, 0);
        setMyClan({ ...clan, total_income: totalInc });
        setClanMembers(enrichedMembers);
        setMyClanRole(member.role);

        if (member.role === 4) {
          const {  apps } = await supabase.from('clan_applications').select('id, user_id, status').eq('clan_id', clan.id).eq('status', 'pending');
          const enrichedApps = await Promise.all((apps || []).map(async (a: any) => {
            const {  u } = await supabase.from('users').select('id, nickname, owned_currencies, max_balance').eq('id', a.user_id).single();
            return { ...a, ...u, incomePerMin: calculateIncome(u) };
          }));
          setClanApplications(enrichedApps);
        }
      }
    } else {
      setMyClan(null);
      setClanMembers([]);
      setMyClanRole(0);
    }
  };

  const fetchFriendsData = async () => {
    if (!isAuthenticated) return;
    const {  reqs } = await supabase.from('friend_requests').select('*').or(`sender_id.eq.${userIdNum},receiver_id.eq.${userIdNum}`).eq('status', 'pending');
    const incoming = (reqs || []).filter((r: any) => r.receiver_id === userIdNum);
    setMessages(incoming.map((r: any) => ({ ...r, type: 'friend', sender_nickname: 'Пользователь' })));

    const {  accepted } = await supabase.from('friend_requests').select('*').or(`sender_id.eq.${userIdNum},receiver_id.eq.${userIdNum}`).eq('status', 'accepted');
    const friendIds = (accepted || []).map((r: any) => r.sender_id === userIdNum ? r.receiver_id : r.sender_id);
    const friendsData = await Promise.all(friendIds.map(async (id: number) => {
      const {  u } = await supabase.from('users').select('id, nickname, owned_currencies, max_balance, first_login, custom_avatar_url, disable_requests').eq('id', id).single();
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
        const {  data } = await supabase.from('users').select('*').eq('id', userIdNum).single();
        if (data) {
          setBalance(data.balance || 100); setMaxBalance(data.max_balance || 100);
          setOwnedCurrencies(data.owned_currencies || []); setPriceMultipliers(data.price_multipliers || {});
          setSelectedCurrencyId(data.selected_currency || 'btc'); setTotalSpent(data.total_spent || 0);
          setReferrerId(data.referrer_id || null); setReferralBonusGiven(data.referral_bonus_awarded || false);
          setDisableRequests(data.disable_requests || false);
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

  useEffect(() => { if (isLoading) return; const i = setInterval(saveProgress, 15000); return () => clearInterval(i); }, [isLoading, balance, maxBalance, ownedCurrencies, priceMultipliers, selectedCurrencyId, totalSpent, disableRequests]);
  useEffect(() => { if (isLoading) return; const h = () => document.hidden && saveProgress(); document.addEventListener('visibilitychange', h); return () => document.removeEventListener('visibilitychange', h); }, [isLoading, balance, maxBalance, ownedCurrencies, priceMultipliers, selectedCurrencyId, totalSpent, disableRequests]);
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
    if (balance < 100000) return alert('Нужно $100,000!');
    setBalance(p => p - 100000);
    const {  data } = await supabase.from('clans').insert({ 
      name: clanData.name, emoji: clanData.emoji, description: clanData.description,
      min_level: clanData.minLevel, max_members: clanData.maxMembers, 
      creator_id: userIdNum, total_income: 0, require_approval: clanData.requireApproval
    }).select().single();
    if (data) {
      await supabase.from('clan_members').insert({ clan_id: data.id, user_id: userIdNum, role: 4 });
      setShowCreateClan(false); fetchClanData();
    }
  };

  const handleUpdateClan = async (clanData: any) => {
    if (!myClan) return;
    await supabase.from('clans').update({ 
      name: clanData.name, description: clanData.description,
      min_level: clanData.minLevel, max_members: clanData.maxMembers,
      require_approval: clanData.requireApproval
    }).eq('id', myClan.id);
    setShowClanSettings(false); fetchClanData();
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
    const {  targetUser } = await supabase.from('users').select('disable_requests').eq('id', targetId).single();
    if (targetUser?.disable_requests) return alert('Игрок запретил заявки');
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
    const clan = clanSearchResults.find(c => c.id === clanId);
    if (!clan) return;
    const {  myData } = await supabase.from('users').select('disable_requests').eq('id', userIdNum).single();
    if (myData?.disable_requests) return alert('Вы запретили заявки');
    if (clan.members_count >= clan.max_members) return alert('В клане нет мест');
    if (level < clan.min_level) return alert('Ваш уровень слишком мал');
    await supabase.from('clan_applications').insert({ clan_id: clanId, user_id: userIdNum, status: clan.require_approval ? 'pending' : 'accepted' });
    alert(clan.require_approval ? 'Заявка отправлена!' : 'Вы вступили в клан!');
    setShowFindClan(false); if (!clan.require_approval) fetchClanData();
  };

  const searchFriends = async (query: string) => {
    if (!query.trim()) { setFriendSearchResults([]); return; }
    const {  data } = await supabase.from('users').select('id, nickname, owned_currencies, max_balance, custom_avatar_url, disable_requests').ilike('nickname', `%${query}%`).neq('id', userIdNum).limit(10);
    const enriched = (data || []).map((u: any) => ({ ...u, incomePerMin: calculateIncome(u) }));
    setFriendSearchResults(enriched);
  };

  const searchClans = async (query: string) => {
    if (!query.trim()) { setClanSearchResults([]); return; }
    const {  data } = await supabase.from('clans').select('*, count(clan_members.user_id).as.members_count').ilike('name', `%${query}%`).limit(10);
    setClanSearchResults(data || []);
  };

  const openProfile = (user: any) => { 
    setSelectedUser({ ...user, avatarUrl: user.custom_avatar_url, level: getLevelInfo(user.max_balance).level }); 
    setShowProfile(true); 
  };

  const getFontSize = (text: string) => text.length > 15 ? '14px' : text.length > 10 ? '16px' : '20px';

  if (isLoading) return <div style={{color:'white', textAlign:'center', marginTop:'50vh'}}>Загрузка...</div>;
  if (!isAuthenticated) return <Auth onComplete={handleAuthComplete} />;

  return (
    <>
      <div style={styles.container}>
        <div style={styles.levelBar}><span style={styles.levelText}>Lvl {level}</span><div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${progress}%` }}></div></div><span style={styles.levelText}>{level === 30 ? 'MAX' : `Lvl ${level + 1}`}</span></div>

        <div style={styles.topBar}>
          <div style={styles.userSection} onClick={() => openProfile({ id: userIdNum, nickname: currentNickname, incomePerMin: totalIncome, first_login: new Date().toISOString(), custom_avatar_url: avatarUrl, max_balance: maxBalance })}>
            <div style={styles.avatarWrapper}>{avatarUrl ? <img src={avatarUrl} style={styles.avatarImg} /> : <span style={styles.avatarText}>{currentNickname[0].toUpperCase()}</span>}</div>
            <div style={styles.userInfo}><span style={styles.nickname}>{currentNickname} <span style={styles.levelBadge}>Lvl {level}</span></span><div style={styles.balances}><span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: 15 }}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(156,163,175,0.1)', padding: '2px 8px', borderRadius: 6 }}>x{globalMultiplier.toFixed(1)}</span></div></div>
          </div>
          <div style={styles.rightMenuContainer}><TopMenu onSettingsClick={() => setShowSettings(true)} onClanClick={() => setShowClan(true)} onFriendsClick={() => setShowFriends(true)} onShopClick={() => setShowShop(true)} onSearchClick={() => setShowSearch(true)} /></div>
        </div>
        
        <div style={styles.leftButtons}>
          <button onClick={() => setShowMessages(true)} style={styles.leftBtn}><MessageCircle size={20} color="var(--text-primary)" /></button>
          <button onClick={() => setShowLeaderboard(true)} style={styles.leftBtn}><Trophy size={20} color="var(--text-primary)" /></button>
          <button onClick={() => setShowReferral(true)} style={styles.leftBtn}><Handshake size={20} color="var(--text-primary)" /></button>
        </div>

        <div style={styles.center}>
          <div style={styles.incomeDisplay}>+${(totalIncome * 60).toFixed(2)}/мин</div>
          <GPU tier={tier} isMining={totalIncome > 0} />
        </div>
        
        {showOfflineEarnings && (<div style={styles.offlineOverlay}><div style={styles.offlineModal}><div style={styles.offlineIcon}>💰</div><div style={styles.offlineTitle}>Пока тебя не было!</div><div style={{...styles.offlineAmount, fontSize: offlineAmount > 1e9 ? '20px' : offlineAmount > 1e6 ? '28px' : offlineAmount > 1e4 ? '32px' : '36px'}}>+${offlineAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div><div style={styles.offlineText}>Твои майнеры заработали</div></div></div>)}

        <div style={styles.bottomBar}>
          <div style={styles.bottomSection}></div>
          <button onClick={() => setShowCurrencySelector(true)} style={styles.currencyBtn}><span style={styles.currencyName}>{currencies.find(c => c.id === selectedCurrencyId)?.shortName || 'USD'}</span><span style={styles.arrow}>▼</span></button>
          <div style={styles.bottomSection}></div>
        </div>

        <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} musicVolume={50} sfxVolume={50} isDark={isDark} onThemeToggle={() => setIsDark(!isDark)} onSave={() => {}} disableRequests={disableRequests} onDisableRequestsChange={setDisableRequests} />
        <Shop isOpen={showShop} onClose={() => setShowShop(false)} balance={balance} priceMultipliers={priceMultipliers} onBuy={handleBuy} />
        <CurrencySelector isOpen={showCurrencySelector} onClose={() => setShowCurrencySelector(false)} ownedCurrencies={ownedCurrencies} selectedCurrency={selectedCurrencyId} onSelect={setSelectedCurrencyId} />
        <SearchComponent isOpen={showSearch} onClose={() => setShowSearch(false)} balance={balance} priceMultipliers={priceMultipliers} onBuy={handleBuy} />
        <Referral isOpen={showReferral} onClose={() => setShowReferral(false)} currentUserId={userIdNum} />
        
        <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} user={selectedUser} currentUserId={userIdNum} isFriend={friends.some(f => f.id === selectedUser?.id)} isInSameClan={!!myClan && clanMembers.some(m => m.user_id === selectedUser?.id)} myRole={myClanRole} onAddFriend={handleAddFriend} onRemoveFriend={handleRemoveFriend} onKick={handleKick} friends={friends} />

        {showLeaderboard && (
          <div style={styles.overlay} onClick={() => setShowLeaderboard(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLeaderboard(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
              <h2 style={styles.modalTitle}>🏆 Топ игроков</h2>
              <div style={styles.list}>
                {leaderboard.map((player, index) => (
                  <div key={player.id} style={styles.leaderboardItem} onClick={() => openProfile(player)}>
                    <span style={{...styles.rank, ...(index < 3 ? styles.topRank : {})}}>{index + 1}</span>
                    <div style={styles.listAvatar}>{player.avatarUrl ? <img src={player.avatarUrl} style={styles.memberImg} /> : player.nickname[0]}</div>
                    <div style={{flex:1}}><div style={styles.listName}>{player.nickname}</div><div style={styles.listSub}>+${player.incomePerMin.toFixed(0)}/мин</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showClan && (
          <div style={styles.overlay} onClick={() => setShowClan(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowClan(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
              {!myClan ? (
                <>
                  <h2 style={styles.modalTitle}>Кланы</h2>
                  <button onClick={() => setShowCreateClan(true)} style={styles.btnPrimary}>Создать клан ($100,000)</button>
                  <button onClick={() => setShowFindClan(true)} style={styles.btnSecondary}>Найти клан</button>
                </>
              ) : (
                <>
                  <div style={styles.clanHeader}>
                    <div style={styles.clanAvatar}>{myClan.emoji}</div>
                    <div style={{flex:1}}>
                      <h3 style={{...styles.clanName, fontSize: getFontSize(myClan.name)}}>{myClan.name}</h3>
                      <p style={styles.clanIncome}>Общий доход: +${myClan.total_income.toFixed(2)}/мин</p>
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
                </>
              )}
            </div>
          </div>
        )}

        {showFriends && (
          <div style={styles.overlay} onClick={() => setShowFriends(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowFriends(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
              <h2 style={styles.modalTitle}>Друзья</h2>
              <button onClick={() => setShowFriendSearch(true)} style={styles.btnSecondary}><Search size={16} /> Поиск друзей</button>
              <div style={styles.list}>
                {friends.length === 0 ? <p style={{textAlign:'center', color:'#737373'}}>Список друзей пуст</p> : friends.map(f => (
                  <div key={f.id} style={styles.listItem} onClick={() => openProfile(f)}>
                    <div style={styles.listAvatar}>{f.custom_avatar_url ? <img src={f.custom_avatar_url} style={styles.memberImg} /> : f.nickname[0]}</div>
                    <div style={{flex:1}}><div style={styles.listName}>{f.nickname}</div><div style={styles.listSub}>+${f.incomePerMin.toFixed(0)}/мин</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showFriendSearch && (
          <div style={styles.overlay} onClick={() => setShowFriendSearch(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowFriendSearch(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
              <h2 style={styles.modalTitle}>Поиск друзей</h2>
              <input placeholder="Введите никнейм..." value={friendSearchQuery} onChange={(e) => { setFriendSearchQuery(e.target.value); searchFriends(e.target.value); }} style={styles.input} autoFocus />
              <div style={styles.list}>
                {friendSearchResults.length === 0 ? <p style={{textAlign:'center', color:'#737373'}}>Введите имя для поиска</p> : friendSearchResults.map(f => (
                  <div key={f.id} style={styles.listItem}>
                    <div style={styles.listAvatar}>{f.custom_avatar_url ? <img src={f.custom_avatar_url} style={styles.memberImg} /> : f.nickname[0]}</div>
                    <div style={{flex:1}}><div style={styles.listName}>{f.nickname}</div><div style={styles.listSub}>+${f.incomePerMin.toFixed(0)}/мин</div></div>
                    <button onClick={() => handleAddFriend(f.id)} style={styles.btnSmall}><UserPlus size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showMessages && (
          <div style={styles.overlay} onClick={() => setShowMessages(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowMessages(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
              <h2 style={styles.modalTitle}>Сообщения</h2>
              <div style={styles.list}>
                {messages.length === 0 ? <p style={{textAlign:'center', color:'#737373'}}>Нет заявок</p> : messages.map((msg: any) => (
                  <div key={msg.id} style={styles.listItem}>
                    <div style={{flex:1}}>
                      <div style={styles.listName}>{msg.type === 'friend' ? 'Заявка в друзья' : 'Заявка в клан'}</div>
                      <div style={styles.listSub}>От: {msg.sender_nickname || msg.nickname}</div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button onClick={() => msg.type === 'friend' ? handleFriendResponse(msg.id, true) : handleAppResponse(msg.id, true)} style={styles.btnYes}><Check size={16} /></button>
                      <button onClick={() => msg.type === 'friend' ? handleFriendResponse(msg.id, false) : handleAppResponse(msg.id, false)} style={styles.btnNo}><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showCreateClan && (
          <div style={styles.overlay} onClick={() => setShowCreateClan(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>Создать клан</h3>
              <input id="clanName" placeholder="Название (до 25)" maxLength={25} style={styles.input} />
              <textarea id="clanDesc" placeholder="Описание (до 200)" maxLength={200} style={{...styles.input, height: 60, resize: 'none'}} />
              <label style={styles.label}><input type="checkbox" id="requireApproval" /> Вступление по заявке</label>
              <label style={styles.label}>Мин. уровень: <input type="number" id="minLevel" min={1} max={30} defaultValue={1} style={{width: 40, background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4, padding: 2}} /></label>
              <label style={styles.label}>Макс. участников: <input type="number" id="maxMembers" min={5} max={1000} defaultValue={50} style={{width: 60, background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4, padding: 2}} /></label>
              <div style={{display:'flex', gap:8, marginTop: 12}}>
                <button onClick={() => setShowCreateClan(false)} style={styles.btnSecondary}>Отменить</button>
                <button onClick={() => {
                  const name = (document.getElementById('clanName') as HTMLInputElement).value;
                  const description = (document.getElementById('clanDesc') as HTMLTextAreaElement).value;
                  const requireApproval = (document.getElementById('requireApproval') as HTMLInputElement).checked;
                  const minLevel = parseInt((document.getElementById('minLevel') as HTMLInputElement).value);
                  const maxMembers = parseInt((document.getElementById('maxMembers') as HTMLInputElement).value);
                  handleCreateClan({ name, emoji: '🏰', description, requireApproval, minLevel, maxMembers });
                }} style={styles.btnPrimary}>Создать</button>
              </div>
            </div>
          </div>
        )}

        {showClanSettings && myClan && (
          <div style={styles.overlay} onClick={() => setShowClanSettings(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>Настройки клана</h3>
              <input id="editClanName" defaultValue={myClan.name} placeholder="Название (до 25)" maxLength={25} style={styles.input} />
              <textarea id="editClanDesc" defaultValue={myClan.description || ''} placeholder="Описание (до 200)" maxLength={200} style={{...styles.input, height: 60, resize: 'none'}} />
              <label style={styles.label}><input type="checkbox" id="editRequireApproval" defaultChecked={myClan.require_approval} /> Вступление по заявке</label>
              <label style={styles.label}>Мин. уровень: <input type="number" id="editMinLevel" defaultValue={myClan.min_level} min={1} max={30} style={{width: 40, background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4, padding: 2}} /></label>
              <label style={styles.label}>Макс. участников: <input type="number" id="editMaxMembers" defaultValue={myClan.max_members} min={5} max={1000} style={{width: 60, background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4, padding: 2}} /></label>
              <div style={{display:'flex', gap:8, marginTop: 12}}>
                <button onClick={() => setShowClanSettings(false)} style={styles.btnSecondary}>Отменить</button>
                <button onClick={() => {
                  const name = (document.getElementById('editClanName') as HTMLInputElement).value;
                  const description = (document.getElementById('editClanDesc') as HTMLTextAreaElement).value;
                  const requireApproval = (document.getElementById('editRequireApproval') as HTMLInputElement).checked;
                  const minLevel = parseInt((document.getElementById('editMinLevel') as HTMLInputElement).value);
                  const maxMembers = parseInt((document.getElementById('editMaxMembers') as HTMLInputElement).value);
                  handleUpdateClan({ name, description, requireApproval, minLevel, maxMembers });
                }} style={styles.btnPrimary}>Сохранить</button>
              </div>
            </div>
          </div>
        )}

        {showRankManager && (
          <div style={styles.overlay} onClick={() => setShowRankManager(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>Управление рангами</h3>
              <div style={styles.memberList}>
                {clanMembers.filter(m => m.role < 4).map(m => (
                  <div key={m.user_id} style={styles.memberItem}>
                    <input type="checkbox" checked={selectedForRank.includes(m.user_id)} onChange={(e) => {
                      if (e.target.checked) setSelectedForRank([...selectedForRank, m.user_id]);
                      else setSelectedForRank(selectedForRank.filter(id => id !== m.user_id));
                    }} style={{width: 20, height: 20, marginRight: 12}} />
                    <div style={styles.memberAvatar}>{m.custom_avatar_url ? <img src={m.custom_avatar_url} style={styles.memberImg} /> : m.nickname[0]}</div>
                    <div style={{flex:1}}>
                      <div style={styles.memberName}>{m.nickname}</div>
                      <div style={styles.memberRole}>{['', 'Участник', 'Фармила', 'Заместитель', 'Создатель'][m.role]}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop: 16}}>
                <label style={styles.label}>Новый ранг: 
                  <select value={newRank} onChange={(e) => setNewRank(parseInt(e.target.value))} style={{marginLeft: 8, padding: '4px 8px', background: '#262626', border: '1px solid #404040', color: 'white', borderRadius: 4}}>
                    <option value={1}>1 - Участник</option>
                    <option value={2}>2 - Фармила</option>
                    <option value={3}>3 - Заместитель</option>
                  </select>
                </label>
              </div>
              <div style={{display:'flex', gap:8, marginTop: 12}}>
                <button onClick={() => { setShowRankManager(false); setSelectedForRank([]); }} style={styles.btnSecondary}>Отменить</button>
                <button onClick={handleRankUpdate} style={styles.btnPrimary}>Сохранить</button>
              </div>
            </div>
          </div>
        )}

        {showFindClan && (
          <div style={styles.overlay} onClick={() => setShowFindClan(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowFindClan(false)} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
              <h2 style={styles.modalTitle}>Поиск клана</h2>
              <input placeholder="Введите название клана..." value={clanSearchQuery} onChange={(e) => { setClanSearchQuery(e.target.value); searchClans(e.target.value); }} style={styles.input} autoFocus />
              <div style={styles.list}>
                {clanSearchResults.length === 0 ? <p style={{textAlign:'center', color:'#737373'}}>Введите название для поиска</p> : clanSearchResults.map(clan => (
                  <div key={clan.id} style={styles.listItem}>
                    <div style={styles.clanAvatar}>{clan.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={styles.listName}>{clan.name}</div>
                      <div style={styles.listSub}>{clan.members_count || 0}/{clan.max_members} участников • Мин. ур: {clan.min_level}</div>
                    </div>
                    <button onClick={() => handleJoinClan(clan.id)} style={styles.btnSmall}>Вступить</button>
                  </div>
                ))}
              </div>
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
  userSection: { display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto', cursor: 'pointer' },
  avatarWrapper: { width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  userInfo: { flex: 1 },
  nickname: { fontSize: 15, fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' },
  levelBadge: { fontSize: 11, color: 'var(--accent)', background: 'rgba(156,163,175,0.1)', padding: '2px 6px', borderRadius: 4, marginLeft: 4 },
  balances: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  rightMenuContainer: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'auto' },
  leftButtons: { position: 'absolute', left: 16, top: 110, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 100 },
  leftBtn: { width: 44, height: 44, borderRadius: 12, background: 'rgba(38,38,38,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(156,163,175,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.1s' },
  center: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', paddingTop: 40, textAlign: 'center' },
  incomeDisplay: { fontSize: 18, fontWeight: 'bold', color: 'var(--success)', marginBottom: 16 },
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
  iconBtn: { width: 36, height: 36, borderRadius: 10, background: 'rgba(38,38,38,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#a3a3a3', position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 'bold', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
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
  label: { display: 'flex', alignItems: 'center', gap: 8, color: '#a3a3a3', fontSize: 13, marginBottom: 8 },
  offlineOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
  offlineModal: { background: '#141414', border: '2px solid #22c55e', borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: '0 0 50px rgba(34,197,94,0.4)', minWidth: 280, maxWidth: '90%' },
  offlineIcon: { fontSize: 48, marginBottom: 12 },
  offlineTitle: { fontSize: 22, fontWeight: 'bold', color: '#22c55e', marginBottom: 8 },
  offlineAmount: { fontWeight: 'bold', color: '#4ade80', marginBottom: 8, textShadow: '0 0 20px rgba(74,222,128,0.5)', transition: 'font-size 0.3s ease' },
  offlineText: { fontSize: 14, color: '#9ca3af' },
  btnYes: { background: '#22c55e', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },
  btnNo: { background: '#ef4444', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }
};

export default App;