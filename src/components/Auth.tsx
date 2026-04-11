import React, { useState, useEffect } from 'react';
import { Gamepad2 } from 'lucide-react';

interface AuthProps {
  onComplete: (nickname: string, referrerId: number | null) => void;
}

export const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [referrerId, setReferrerId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    
    if (ref && !isNaN(Number(ref))) {
      setReferrerId(Number(ref));
      console.log('🔗 Обнаружена реферальная ссылка от ID:', ref);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length >= 2) {
      onComplete(nickname.trim(), referrerId);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <Gamepad2 size={48} color="#22c55e" />
        </div>
        
        <h1 style={styles.title}>Crypto Nexus</h1>
        <p style={styles.subtitle}>Введите ваш никнейм для старта</p>
        
        {referrerId && (
          <div style={styles.referralBadge}>
            🤝 Вас пригласил друг!
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ваш никнейм..."
            style={styles.input}
            autoFocus
            maxLength={15}
          />
          
          <button 
            type="submit" 
            disabled={nickname.trim().length < 2}
            style={{
              ...styles.button,
              opacity: nickname.trim().length < 2 ? 0.5 : 1,
              cursor: nickname.trim().length < 2 ? 'not-allowed' : 'pointer'
            }}
          >
            НАЧАТЬ ИГРУ
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100vw',
    height: '100vh',
    background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
  },
  card: {
    background: '#141414',
    padding: 32,
    borderRadius: 24,
    width: '85%',
    maxWidth: 360,
    textAlign: 'center',
    border: '1px solid rgba(156, 163, 175, 0.1)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
  },
  iconContainer: {
    marginBottom: 16,
    animation: 'bounce 2s infinite'
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white', // ТЕПЕРЬ БЕЛЫЙ
    marginBottom: 8,
    marginTop: 0
  },
  subtitle: {
    color: '#737373',
    fontSize: 14,
    marginBottom: 24
  },
  referralBadge: {
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
    border: '1px solid rgba(34, 197, 94, 0.2)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid rgba(156, 163, 175, 0.2)',
    background: '#0a0a0a',
    color: 'white',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    transition: 'transform 0.1s'
  }
};