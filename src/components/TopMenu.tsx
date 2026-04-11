import React from 'react';
import { Settings, Users, UsersRound, Search } from 'lucide-react';

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
        <span style={styles.icon}>🛒</span>
      </button>
      <button onClick={onClanClick} style={styles.button}>
        <UsersRound size={18} color="#9ca3af" />
      </button>
      <button onClick={onFriendsClick} style={styles.button}>
        <Users size={18} color="#9ca3af" />
      </button>
      <button onClick={onSearchClick} style={styles.button}>
        <Search size={18} color="#9ca3af" />
      </button>
      <button onClick={onSettingsClick} style={styles.button}>
        <Settings size={18} color="#9ca3af" />
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'rgba(38, 38, 38, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(156, 163, 175, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  icon: {
    fontSize: 18
  }
};