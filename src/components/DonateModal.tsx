import React, { useState } from 'react';
import { X, Crown, Zap, Star, CreditCard } from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (type: string, currency: string, days: number) => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose, onPurchase }) => {
  const [selectedDays, setSelectedDays] = useState(1);
  const [showDaysPopup, setShowDaysPopup] = useState(false);
  const [activeBoostType, setActiveBoostType] = useState('');

  if (!isOpen) return null;

  const openDaysPopup = (type: string) => {
    setActiveBoostType(type);
    setSelectedDays(1);
    setShowDaysPopup(true);
  };

  const handleBuyBoost = (currency: string) => {
    if (!activeBoostType) return;
    onPurchase(activeBoostType, currency, selectedDays);
    setShowDaysPopup(false);
  };

  const handleBuyVip = (type: string, currency: string) => {
    onPurchase(type, currency, 0);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <h2 style={styles.modalTitle}>💎 VIP Магазин</h2>
        <p style={styles.subtitle}>Премиум статусы и бусты дохода</p>

        <div style={styles.list}>
          {/* 1. VIP */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Crown size={20} color="#9ca3af" />
              <h3 style={{color: '#9ca3af', margin: 0}}>VIP Статус</h3>
              <span style={styles.badge}>Навсегда</span>
            </div>
            <p style={styles.desc}>+5,000$ на баланс, Бейдж VIP, Буст x1.5 (1 день)</p>
            <div style={styles.priceRow}>
              <button style={{...styles.btnBuy, background: '#a3a3a3'}} onClick={() => handleBuyVip('vip', 'rub')}>50 ₽</button>
              <button style={{...styles.btnBuy, background: '#fbbf24'}} onClick={() => handleBuyVip('vip', 'stars')}>15 ⭐</button>
            </div>
          </div>

          {/* 2. PLATINUM VIP */}
          <div style={{...styles.card, borderColor: '#FFD700'}}>
            <div style={styles.cardHeader}>
              <Crown size={20} color="#FFD700" />
              <h3 style={{color: '#FFD700', margin: 0}}>PLATINUM VIP</h3>
              <span style={styles.badge}>Навсегда</span>
            </div>
            <p style={styles.desc}>+100,000$, Бейдж Platinum, Буст x2.5 (2 дня)</p>
            <div style={styles.priceRow}>
              <button style={{...styles.btnBuy, background: '#FFD700'}} onClick={() => handleBuyVip('platinum', 'rub')}>150 ₽</button>
              <button style={{...styles.btnBuy, background: '#fbbf24'}} onClick={() => handleBuyVip('platinum', 'stars')}>50 ⭐</button>
            </div>
          </div>

          {/* 3. PREMIUM VIP */}
          <div style={{...styles.card, borderColor: '#00FFFF', boxShadow: '0 0 15px rgba(0,255,255,0.2)'}}>
            <div style={styles.cardHeader}>
              <Star size={20} color="#00FFFF" />
              <h3 style={{color: '#00FFFF', margin: 0}}>PREMIUM VIP</h3>
              <span style={{...styles.badge, background: '#00FFFF', color: '#000'}}>Навсегда</span>
            </div>
            <p style={styles.desc}>+500,000$, Алмазный Бейдж, Буст x3.0 (3 дня)</p>
            <div style={styles.priceRow}>
              <button style={{...styles.btnBuy, background: 'linear-gradient(90deg, #00FFFF, #B9F2FF)', color: '#000'}} onClick={() => handleBuyVip('premium', 'rub')}>250 ₽</button>
              <button style={{...styles.btnBuy, background: '#fbbf24'}} onClick={() => handleBuyVip('premium', 'stars')}>150 ⭐</button>
            </div>
          </div>

          {/* БУСТЫ */}
          <div style={styles.divider}>⚡ Бусты Дохода</div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Zap size={20} color="#22c55e" />
              <h3 style={{color: '#22c55e', margin: 0}}>x2 Буст Дохода</h3>
            </div>
            <p style={styles.desc}>Умножает доход x2 на выбранное количество дней.</p>
            <div style={styles.priceRow}>
              <button style={{...styles.btnBuy, background: '#22c55e'}} onClick={() => openDaysPopup('boost_x2')}>Купить</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Zap size={20} color="#a855f7" />
              <h3 style={{color: '#a855f7', margin: 0}}>x3 Буст Дохода</h3>
            </div>
            <p style={styles.desc}>Умножает доход x3 на выбранное количество дней.</p>
            <div style={styles.priceRow}>
              <button style={{...styles.btnBuy, background: '#a855f7'}} onClick={() => openDaysPopup('boost_x3')}>Купить</button>
            </div>
          </div>

           <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Zap size={20} color="#ef4444" />
              <h3 style={{color: '#ef4444', margin: 0}}>x5 Буст Дохода</h3>
            </div>
            <p style={styles.desc}>Умножает доход x5 на выбранное количество дней.</p>
            <div style={styles.priceRow}>
              <button style={{...styles.btnBuy, background: '#ef4444'}} onClick={() => openDaysPopup('boost_x5')}>Купить</button>
            </div>
          </div>
        </div>
      </div>

      {/* Попап выбора дней */}
      {showDaysPopup && (
        <div style={styles.daysOverlay}>
          <div style={styles.daysModal}>
            <h3 style={styles.daysTitle}>Сколько дней?</h3>
            <div style={styles.dayOptions}>
              {[1, 3, 7, 30].map(d => (
                <button 
                  key={d} 
                  onClick={() => setSelectedDays(d)} 
                  style={{...styles.dayBtn, background: selectedDays === d ? '#fff' : '#333', color: selectedDays === d ? '#000' : '#fff'}}
                >
                  {d} {d === 1 ? 'день' : 'дня'}
                </button>
              ))}
            </div>
            <p style={{textAlign:'center', color:'#a3a3a3', marginTop: 12}}>
              Стоимость за {selectedDays} дн:
              <br />
              {activeBoostType === 'boost_x2' && <><b>{50 * selectedDays} ₽</b> или <b>{15 * selectedDays} ⭐</b></>}
              {activeBoostType === 'boost_x3' && <><b>{80 * selectedDays} ₽</b> или <b>{35 * selectedDays} ⭐</b></>}
              {activeBoostType === 'boost_x5' && <><b>{150 * selectedDays} ₽</b> или <b>{80 * selectedDays} ⭐</b></>}
            </p>
            <div style={{display:'flex', gap: 10, marginTop: 10}}>
              <button style={{...styles.btnPay, background: '#fff'}} onClick={() => handleBuyBoost('rub')}>Оплатить ₽</button>
              <button style={{...styles.btnPay, background: '#fbbf24', color: '#000'}} onClick={() => handleBuyBoost('stars')}>⭐ Stars</button>
            </div>
            <button style={{...styles.btnBack, color:'#737373'}} onClick={() => setShowDaysPopup(false)}>Назад</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: any = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:9999, backdropFilter:'blur(10px)' },
  modal: { position:'relative', background:'#141414', border:'1px solid #333', borderRadius:24, width:'90%', maxWidth:400, maxHeight:'90vh', overflowY:'auto', margin:'auto', padding:24 },
  closeBtn: { position:'absolute', top:16, right:16, background:'none', border:'none', cursor:'pointer' },
  modalTitle: { fontSize:24, fontWeight:'bold', color:'#fff', textAlign:'center', margin:0 },
  subtitle: { textAlign:'center', color:'#737373', marginTop:8 },
  list: { display:'flex', flexDirection:'column', gap:16, marginTop:24 },
  card: { background:'#1e1e1e', border:'1px solid #333', borderRadius:16, padding:16 },
  cardHeader: { display:'flex', alignItems:'center', gap:10, marginBottom:8 },
  badge: { background:'#333', color:'#fff', padding:'4px 8px', borderRadius:6, fontSize:10, fontWeight:'bold' },
  desc: { color:'#a3a3a3', fontSize:13, margin:'4px 0 12px 0', lineHeight:1.4 },
  priceRow: { display:'flex', gap:10 },
  btnBuy: { flex:1, padding:'10px', borderRadius:10, border:'none', fontWeight:'bold', cursor:'pointer', fontSize:13 },
  divider: { textAlign:'center', color:'#525252', margin:'10px 0', fontWeight:'bold' },
  daysOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 },
  daysModal: { background:'#262626', padding:24, borderRadius:20, width:320, textAlign:'center' },
  daysTitle: { color:'#fff', margin:'0 0 16px 0' },
  dayOptions: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  dayBtn: { padding:'12px', borderRadius:12, border:'1px solid #444', fontWeight:'bold', cursor:'pointer' },
  btnPay: { flex:1, padding:'12px', borderRadius:12, border:'none', fontWeight:'bold', fontSize:14, cursor:'pointer' },
  btnBack: { background:'none', border:'none', marginTop:12, cursor:'pointer', fontSize:13 }
};