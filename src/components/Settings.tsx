import React from 'react';
import { X } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  musicVolume: number;
  sfxVolume: number;
  isDark: boolean;
  onThemeToggle: () => void;
  onSave: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  musicVolume,
  sfxVolume,
  isDark,
  onThemeToggle,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <h2 style={styles.title}>Настройки</h2>
        
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Звук</h3>
          <div style={styles.settingRow}>
            <span style={styles.label}>Музыка: {musicVolume}%</span>
            <input type="range" min="0" max="100" defaultValue={musicVolume} style={styles.slider} />
          </div>
          <div style={styles.settingRow}>
            <span style={styles.label}>Звуки: {sfxVolume}%</span>
            <input type="range" min="0" max="100" defaultValue={sfxVolume} style={styles.slider} />
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Интерфейс</h3>
          <div style={styles.settingRow}>
            <span style={styles.label}>Тёмная тема</span>
            <button onClick={onThemeToggle} style={styles.toggleBtn}>{isDark ? 'ON' : 'OFF'}</button>
          </div>
        </div>

        <button onClick={onSave} style={styles.saveBtn}>Сохранить</button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(8px)'
  },
  modal: {
    background: '#141414',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 360,
    position: 'relative',
    border: '1px solid rgba(156,163,175,0.15)'
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e5e5e5',
    marginBottom: 24,
    textAlign: 'center'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a3a3a3',
    marginBottom: 12
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: '8px 0'
  },
  label: {
    fontSize: 14,
    color: '#e5e5e5'
  },
  slider: {
    width: 120,
    cursor: 'pointer'
  },
  toggleBtn: {
    padding: '6px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#22c55e',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: 12
  },
  saveBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: '#22c55e',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 8
  }
};