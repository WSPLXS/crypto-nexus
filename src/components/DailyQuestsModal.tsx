import React from 'react';
import { X, Gift, CheckCircle2, Clock } from 'lucide-react';

interface DailyQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: any[];
  boostActive: boolean;
  boostTimeLeft: number;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({ isOpen, onClose, quests, boostActive, boostTimeLeft }) => {
  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} color="#9ca3af" /></button>
        <h2 style={styles.modalTitle}>📜 Ежедневные задания</h2>

        {boostActive && (
          <div style={styles.boostBanner}>
            <Clock size={18} color="#fbbf24" />
            <span>Буст x2 активен: {formatTime(boostTimeLeft)}</span>
          </div>
        )}

        <div style={styles.questList}>
          {quests.map((q: any) => (
            <div key={q.id} style={styles.questCard}>
              <div style={styles.questInfo}>
                <span style={styles.questTitle}>{q.title}</span>
                <span style={styles.questProgress}>{q.progress.toFixed(0)} / {q.target} {q.unit}</span>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: `${Math.min(100, (q.progress / q.target) * 100)}%`}} />
                </div>
              </div>
              <div style={styles.questReward}>
                {q.completed ? <CheckCircle2 size={24} color="#22c55e" /> : <Gift size={24} color="#a3a3a3" />}
                <span style={{fontSize:10, color:'#737373', marginTop:4}}>x2 Буст 30м</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: any = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(8px)' },
  modal: { background:'#141414', border:'1px solid rgba(156,163,175,0.15)', borderRadius:20, padding:24, width:'90%', maxWidth:380, position:'relative', maxHeight:'80vh', overflowY:'auto' },
  closeBtn: { position:'absolute', top:16, right:16, background:'none', border:'none', cursor:'pointer' },
  modalTitle: { fontSize:20, fontWeight:'bold', color:'#e5e5e5', marginBottom:16, textAlign:'center' },
  boostBanner: { background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.3)', borderRadius:12, padding:10, marginBottom:16, display:'flex', alignItems:'center', gap:8, color:'#fbbf24', fontSize:13, justifyContent:'center' },
  questList: { display:'flex', flexDirection:'column', gap:12 },
  questCard: { display:'flex', justifyContent:'space-between', alignItems:'center', background:'#1e1e1e', padding:12, borderRadius:12 },
  questInfo: { flex:1, marginRight:12 },
  questTitle: { fontSize:14, fontWeight:'bold', color:'#e5e5e5', display:'block', marginBottom:4 },
  questProgress: { fontSize:12, color:'#737373', display:'block', marginBottom:6 },
  progressBar: { height:6, background:'#333', borderRadius:3, overflow:'hidden' },
  progressFill: { height:'100%', background:'#22c55e', borderRadius:3, transition:'width 0.3s' },
  questReward: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minWidth:40 }
};