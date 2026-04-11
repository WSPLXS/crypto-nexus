import React from 'react';
import { Settings, Users, Shield, Search, ShoppingCart } from 'lucide-react';

interface TopMenuProps {
  onSettingsClick: () => void;
  onClanClick: () => void;
  onFriendsClick: () => void;
  onShopClick: () => void;
  onSearchClick: () => void;
}

export const TopMenu: React.FC<TopMenuProps> = ({
  onSettingsClick,
  onClanClick,
  onFriendsClick,
  onShopClick,
  onSearchClick
}) => {
  return (
    <div style={styles.container}>
      <button onClick={onShopClick} style={styles.button}>
        <ShoppingCart size={20} color="var(--text-primary)" />
      </button>
      <button onClick={onClanClick} style={styles.button}>
        <Shield size={20} color="var(--text-primary)" />
      </button>
      <button onClick={onFriendsClick} style={styles.button}>
        <Users size={20} color="var(--text-primary)" />
      </button>
      <button onClick={onSearchClick} style={styles.button}>
        <Search size={20} color="var(--text-primary)" />
      </button>
      <button onClick={onSettingsClick} style={styles.button}>
        <Settings size={20} color="var(--text-primary)" />
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column', // 🔥 ВЕРТИКАЛЬНОЕ РАСПОЛОЖЕНИЕ
    gap: 8,
    alignItems: 'center'
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'rgba(38, 38, 38, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(156, 163, 175, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }
};