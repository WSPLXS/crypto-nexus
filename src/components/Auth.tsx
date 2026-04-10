import React, { useState } from 'react';

interface AuthProps {
  onComplete: (nickname: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();

    if (trimmed.length < 3) {
      setError('Ник должен быть не менее 3 символов');
      return;
    }
    if (trimmed.length > 20) {
      setError('Ник должен быть не более 20 символов');
      return;
    }

    localStorage.setItem('cryptoNexus_nickname', trimmed);
    onComplete(trimmed);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>₿</div>
          <h1 style={styles.title}>Crypto Nexus</h1>
        </div>

        <p style={styles.subtitle}>Введите ваш никнейм для начала</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={{
            ...styles.inputWrapper,
            borderColor: isFocused ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.15)',
            boxShadow: isFocused ? '0 0 0 3px rgba(156, 163, 175, 0.08)' : 'none'
          }}>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (error) setError('');
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ваш ник..."
              style={styles.input}
              autoFocus
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={styles.button}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Начать игру
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #0a0a0a 0%, #111111 100%)',
    padding: 20,
  },
  card: {
    background: 'linear-gradient(145deg, #141414 0%, #0f0f0f 100%)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    border: '1px solid rgba(156, 163, 175, 0.1)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  logo: {
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e5e5e5',
    marginBottom: 8,
    textShadow: '0 0 20px rgba(229, 229, 229, 0.15)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e5e5e5',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 28,
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inputWrapper: {
    borderRadius: 14,
    border: '1px solid rgba(156, 163, 175, 0.15)',
    background: 'rgba(20, 20, 20, 0.6)',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'transparent',
    border: 'none',
    color: '#e5e5e5',
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    margin: 0,
    textAlign: 'left',
    paddingLeft: 4,
  },
  button: {
    width: '100%',
    padding: '15px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(145deg, #262626 0%, #171717 100%)',
    color: '#e5e5e5',
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    marginTop: 8,
  },
};