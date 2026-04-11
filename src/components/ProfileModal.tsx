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
  onAddFriend: (userId: number) => void;
  onRemoveFriend: (userId: number) => void;
  onKick: (userId: number) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen, onClose, user, currentUserId, isFriend, isInSameClan, myRole,
  onAddFriend, onRemoveFriend, onKick
}) => {
  if (!isOpen || !user) return null;

  const getPlaytime = (dateStr: string) => {
    if (!dateStr) return 'Только что';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours} ч.`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} дн.`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} мес.`;
    return `${Math.floor(months / 12)} г.`;
  };

  // 🔥 ИСПРАВЛЕНИЕ: Добавили типизацию
  const roleNames: { [key: number]: string } = { 
    1: 'Участник', 
    2: 'Фармила', 
    3: 'Заместитель', 
    4: 'Создатель' 
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        
        <div style={styles.header}>
          <div style={styles.avatar}>{user.avatarUrl ? <img src={user.avatarUrl} style={styles.avatarImg} /> : user.nickname[0]}</div>
          <div>
            <h3 style={styles.name}>{user.nickname}</h3>
            <p style={styles.income}>+${user.incomePerMin?.toFixed(2) || '0.00'}/мин</p>
            <p style={styles.time}>В игре: {getPlaytime(user.first_login || user.created_at)}</p>
            {user.role && <p style={styles.role}>Ранг: {roleNames[user.role] || 'Неизвестно'}</p>}
          </div>
        </div>

        <div style={styles.actions}>
          {user.id !== currentUserId && (
            <>
              {!isFriend && !isInSameClan && (
                <button onClick={() => onAddFriend(user.id)} style={styles.btnPrimary}>
                  <UserPlus size={16} /> Добавить в друзья
                </button>
              )}
              {isFriend && (
                <button onClick={() => onRemoveFriend(user.id)} style={styles.btnDanger}>
                  <UserMinus size={16} /> Удалить из друзей
                </button>
              )}
              {isInSameClan && myRole === 4 && user.role < 4 && (
                <button onClick={() => onKick(user.id)} style={styles.btnDanger}>
                  <ShieldAlert size={16} /> Исключить из клана
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' },
  modal: { background: '#141414', borderRadius: 20, padding: 24, width: '90%', maxWidth: 340, position: 'relative', border: '1px solid rgba(156,163,175,0.15)' },
  closeBtn: { position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#737373', cursor: 'pointer' },
  header: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', color: 'white', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#e5e5e5', margin: '0 0 4px 0' },
  income: { fontSize: 14, color: '#22c55e', margin: 0 },
  time: { fontSize: 12, color: '#737373', margin: '4px 0 0 0' },
  role: { fontSize: 12, color: '#fbbf24', margin: '2px 0 0 0', fontWeight: '600' },
  actions: { display: 'flex', flexDirection: 'column', gap: 8 },
  btnPrimary: { padding: '10px', borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDanger: { padding: '10px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
};