import React from 'react';
import { X, UserPlus, UserMinus, ShieldAlert } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  currentUserId: number;
  isFriend: boolean;
  isInSameClan: boolean;
  myRole: number;
  onAddFriend: (id: number) => void;
  onRemoveFriend: (id: number) => void;
  onKick: (id: number) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen, onClose, user, currentUserId, isFriend, isInSameClan, myRole,
  onAddFriend, onRemoveFriend, onKick
}) => {
  if (!isOpen || !user) return null;
  const isMe = user.id === currentUserId;

  // Рендер VIP-бейджа (полные названия)
  const renderVipBadge = (status: string) => {
    if (!status || status === 'none') return null;
    let bg = '#9ca3af', color = '#fff', text = 'VIP';
    if (status === 'platinum') { 
      bg = 'linear-gradient(90deg, #FFD700, #FDB931)'; 
      color = '#fff'; 
      text = 'PLATINUM'; 
    }
    if (status === 'premium') { 
      bg = 'linear-gradient(90deg, #00FFFF, #B9F2FF)'; 
      color = '#000'; 
      text = 'PREMIUM'; 
    }
    return <span style={{...styles.vipBadge, background: bg, color}}>{text}</span>;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        
        <div style={styles.header}>
          <div style={styles.avatarWrapper}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} style={styles.avatarImg} alt="avatar" />
            ) : (
              <span style={styles.avatarText}>{user.nickname?.[0] || '?'}</span>
            )}
          </div>
          <h2 style={styles.nickname}>
            {user.nickname || 'Игрок'} {renderVipBadge(user.vip_status)}
          </h2>
          <p style={styles.level}>Уровень {user.level || 1}</p>
        </div>

        {/* 🔥 ТОЛЬКО ДОХОД В МИНУТУ */}
        <div style={styles.statsBox}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>💰 Доход в минуту</span>
            <span style={styles.statValue}>+${user.incomePerMin?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {!isMe && (
          <div style={styles.actions}>
            {isFriend ? (
              <button onClick={() => onRemoveFriend(user.id)} style={styles.btnDanger}>
                <UserMinus size={16} /> Удалить из друзей
              </button>
            ) : (
              <button onClick={() => onAddFriend(user.id)} style={styles.btnPrimary}>
                <UserPlus size={16} /> Добавить в друзья
              </button>
            )}
            
            {isInSameClan && myRole === 4 && (
              <button onClick={() => onKick(user.id)} style={styles.btnWarning}>
                <ShieldAlert size={16} /> Исключить из клана
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { 
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    zIndex: 10000, backdropFilter: 'blur(8px)' 
  },
  modal: { 
    background: '#141414', border: '1px solid rgba(156,163,175,0.15)', 
    borderRadius: 20, padding: 24, width: '90%', maxWidth: 360, 
    position: 'relative', textAlign: 'center' 
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' },
  header: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 20 },
  avatarWrapper: { 
    width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    background: '#3b82f6', border: '3px solid rgba(255,255,255,0.1)' 
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  nickname: { 
    fontSize: 20, fontWeight: 'bold', color: '#e5e5e5', margin: 0, 
    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' 
  },
  level: { fontSize: 14, color: '#737373', margin: 0 },
  statsBox: { 
    background: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 20, 
    border: '1px solid #262626', display: 'flex', flexDirection: 'column', alignItems: 'center' 
  },
  statItem: { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' },
  statLabel: { fontSize: 13, color: '#a3a3a3', textAlign: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#22c55e' },
  actions: { display: 'flex', flexDirection: 'column', gap: 10 },
  btnPrimary: { 
    padding: '12px', borderRadius: 12, border: 'none', background: '#22c55e', 
    color: 'white', fontWeight: 'bold', cursor: 'pointer', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
  },
  btnDanger: { 
    padding: '12px', borderRadius: 12, border: 'none', background: '#ef4444', 
    color: 'white', fontWeight: 'bold', cursor: 'pointer', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
  },
  btnWarning: { 
    padding: '12px', borderRadius: 12, border: '1px solid #f59e0b', background: 'transparent', 
    color: '#f59e0b', fontWeight: 'bold', cursor: 'pointer', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
  },
  vipBadge: { 
    fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4, 
    verticalAlign: 'middle', boxShadow: '0 0 5px rgba(0,0,0,0.3)' 
  }
};