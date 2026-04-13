import React, { useState } from 'react';
import { X, TrendingUp, Zap, Clock, ShoppingBag, Briefcase } from 'lucide-react';
import { BUSINESSES } from '../data/economy';

interface BusinessCenterModalProps {
  isOpen: boolean; onClose: () => void; userId: number; bankUsd: number;
  ownedBusinesses: any[]; businessMaintenance: any; totalIncome: number;
  onBuy: (biz: any) => void; onPayMaintenance: (bizId: string, type: 'electricity' | 'repair') => void;
}

export const BusinessCenterModal: React.FC<BusinessCenterModalProps> = ({ isOpen, onClose, bankUsd, ownedBusinesses, businessMaintenance, totalIncome, onBuy, onPayMaintenance }) => {
  if (!isOpen) return null;
  const [view, setView] = useState<'dashboard' | 'shop' | 'my'>('dashboard');
  const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

  const getMaintenanceStatus = (bizId: string) => {
    const m = businessMaintenance[bizId];
    if (!m) return { electricity: true, repair: true };
    const now = Date.now();
    return {
      electricity: (now - m.electricity) < 36 * 3600 * 1000,
      repair: (now - m.repair) < 168 * 3600 * 1000
    };
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <div style={styles.header}><Briefcase size={24} color="#22c55e" /><h2 style={styles.title}>Бизнес Центр</h2></div>
        
        <div style={styles.tabs}>
          {['dashboard', 'shop', 'my'].map(t => (
            <button key={t} onClick={() => setView(t as any)} style={{...styles.tab, ...(view === t ? styles.tabActive : {})}}>{t === 'dashboard' ? 'Доход' : t === 'shop' ? 'Купить' : 'Мои'}</button>
          ))}
        </div>

        {view === 'dashboard' && (
          <div style={styles.content}>
            <div style={styles.statCard}><TrendingUp size={24} color="#22c55e" /><div><span style={styles.statLabel}>Доход в час</span><span style={styles.statValue}>${fmt(totalIncome * 60)}</span></div></div>
            <div style={styles.statCard}><Zap size={24} color="#fbbf24" /><div><span style={styles.statLabel}>Электричество</span><span style={styles.statSub}>Каждые 36ч</span></div></div>
            <div style={styles.statCard}><Clock size={24} color="#ef4444" /><div><span style={styles.statLabel}>Ремонт</span><span style={styles.statSub}>Каждые 168ч</span></div></div>
            <p style={{color:'#737373', fontSize:12, textAlign:'center', marginTop:8}}>Прибыль автоматически поступает на банковский счет</p>
          </div>
        )}

        {view === 'shop' && (
          <div style={styles.list}>
            {BUSINESSES.map(b => (
              <div key={b.id} style={styles.item}>
                <div style={{fontSize:32}}>{b.icon}</div>
                <div style={{flex:1}}>
                  <div style={styles.itemTitle}>{b.name}</div>
                  <div style={styles.itemSub}>{b.desc} • +${b.incomePerHour}/ч</div>
                </div>
                <button onClick={() => { if(bankUsd >= b.priceUsd) { onBuy(b); alert(`✅ ${b.name} куплен!`); } else alert('❌ Недостаточно средств на счете'); }} style={styles.btnBuy}>${b.priceUsd}</button>
              </div>
            ))}
          </div>
        )}

        {view === 'my' && (
          <div style={styles.list}>
            {ownedBusinesses.length === 0 ? <p style={{color:'#737373', textAlign:'center'}}>У вас нету бизнесов</p> : ownedBusinesses.map((b, i) => {
              const conf = BUSINESSES.find(c => c.id === b.id);
              const status = getMaintenanceStatus(b.id);
              return (
                <div key={i} style={styles.item}>
                  <div style={{fontSize:28}}>{conf?.icon}</div>
                  <div style={{flex:1}}>
                    <div style={styles.itemTitle}>{conf?.name}</div>
                    <div style={styles.itemSub}>
                      {!status.electricity && <span style={{color:'#fbbf24'}}>⚡ Свет выкл. </span>}
                      {!status.repair && <span style={{color:'#ef4444'}}>🔧 Треб. ремонт </span>}
                      {status.electricity && status.repair && <span style={{color:'#22c55e'}}>✅ Работает</span>}
                    </div>
                  </div>
                  <div style={{display:'flex', gap:4}}>
                    {!status.electricity && <button onClick={() => onPayMaintenance(b.id, 'electricity')} style={styles.btnSmall}>Свет $50</button>}
                    {!status.repair && <button onClick={() => onPayMaintenance(b.id, 'repair')} style={styles.btnSmall}>Ремонт $200</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: any = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modal: { background: '#141414', border: '1px solid #22c55e', borderRadius: 24, padding: 20, width: '90%', maxWidth: 360, position: 'relative', maxHeight: '85vh', overflowY: 'auto' },
  closeBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', margin: 0 },
  tabs: { display: 'flex', background: '#1a1a1a', borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: 'transparent', color: '#737373', fontWeight: '600', cursor: 'pointer', fontSize: 13 },
  tabActive: { background: '#22c55e', color: '#fff' },
  content: { display: 'flex', flexDirection: 'column', gap: 12 },
  statCard: { background: '#1a1a1a', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 16 },
  statLabel: { display: 'block', color: '#737373', fontSize: 12 },
  statValue: { display: 'block', color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statSub: { display: 'block', color: '#fbbf24', fontSize: 11 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  item: { background: '#1a1a1a', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 },
  itemTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  itemSub: { color: '#737373', fontSize: 11 },
  btnBuy: { padding: '8px 12px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  btnSmall: { padding: '4px 8px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#000', fontSize: 10, cursor: 'pointer' }
};