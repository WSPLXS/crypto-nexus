import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean; onClose: () => void;
  musicVolume: number; sfxVolume: number;
  isDark: boolean; onThemeToggle: () => void;
  onSave: (s: { musicVolume: number; sfxVolume: number }) => void;
}

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, musicVolume, sfxVolume, isDark, onThemeToggle, onSave }) => {
  const [localMusic, setLocalMusic] = useState(musicVolume);
  const [localSfx, setLocalSfx] = useState(sfxVolume);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Настройки</h2>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} color="var(--text-secondary)" /></button>
        </div>

        <div style={styles.section}>
          <div style={styles.row}>
            <span style={styles.label}>🎨 Тема</span>
            <div className={`ios-toggle ${isDark ? '' : 'active'}`} onClick={onThemeToggle}>
              <div className="ios-toggle-knob"></div>
            </div>
          </div>
          <div style={styles.themeLabels}>
            <span style={{ color: isDark ? 'var(--accent)' : 'var(--text-secondary)' }}>🌙 Dark</span>
            <span style={{ color: !isDark ? 'var(--accent)' : 'var(--text-secondary)' }}>☀️ Light</span>
          </div>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>🎵 Музыка: {localMusic}%</label>
          <input type="range" min="0" max="100" value={localMusic} onChange={(e) => setLocalMusic(Number(e.target.value))} />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>🔊 Звуки: {localSfx}%</label>
          <input type="range" min="0" max="100" value={localSfx} onChange={(e) => setLocalSfx(Number(e.target.value))} />
        </div>

        <button onClick={() => { onSave({ musicVolume: localMusic, sfxVolume: localSfx }); onClose(); }} style={styles.saveBtn}>
          Сохранить
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'var(--bg-panel)', borderRadius: 20, padding: 24, width: '90%', maxWidth: 380, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: 'var(--text-primary)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  section: { marginBottom: 24 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 },
  themeLabels: { display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 },
  saveBtn: { width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 16, fontWeight: '600', cursor: 'pointer' },
};