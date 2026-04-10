import React from 'react';
import { Settings, Shield, Users, Search, ShoppingCart } from 'lucide-react';

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
  onSearchClick,
}) => {
  const menuItems = [
    { icon: Settings, label: 'Settings', onClick: onSettingsClick, color: '#9ca3af', soon: false },
    { icon: Shield, label: 'Clan', onClick: onClanClick, color: '#737373', soon: true },
    { icon: Users, label: 'Friends', onClick: onFriendsClick, color: '#737373', soon: true },
    { icon: Search, label: 'Search', onClick: onSearchClick, color: '#9ca3af', soon: false },
    { icon: ShoppingCart, label: 'Shop', onClick: onShopClick, color: '#f472b6', soon: false },
  ];

  return (
    <div style={styles.container}>
      {menuItems.map((item, index) => (
        <button 
          key={index} 
          onClick={item.onClick} 
          style={{
            ...styles.button,
            opacity: item.soon ? 0.6 : 1,
            cursor: item.soon ? 'not-allowed' : 'pointer',
          }}
        >
          <div style={styles.iconWrapper}>
            <item.icon size={24} color={item.color} />
            {item.soon && <span style={styles.soonBadge}>СКОРО</span>}
          </div>
          <span style={{ ...styles.label, color: item.color }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'absolute', top: 60, right: 16,
    display: 'flex', flexDirection: 'column', gap: 12, zIndex: 100,
  },
  button: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12, padding: '10px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    transition: 'all 0.2s', backdropFilter: 'blur(10px)',
  },
  iconWrapper: {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonBadge: {
    position: 'absolute' as const,
    top: -8,
    right: -12,
    background: 'linear-gradient(135deg, #f472b6 0%, #a855f7 100%)',
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    padding: '2px 4px',
    borderRadius: 6,
    letterSpacing: '0.5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    whiteSpace: 'nowrap' as const,
  },
  label: { fontSize: 11, fontWeight: 500 },
};