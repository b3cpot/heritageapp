import React, { useState } from 'react';

const PasswordProtection = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'Beqir123') {
      localStorage.setItem('heritage_access', 'granted');
      onSuccess();
    } else {
      setError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'rgba(30, 30, 45, 0.95)',
        borderRadius: 20,
        padding: 40,
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(201, 164, 92, 0.2)',
        animation: isShaking ? 'shake 0.5s ease-in-out' : 'none'
      }}>
        {/* Dancing Monkey */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 80,
            animation: 'dance 1s ease-in-out infinite',
            display: 'inline-block'
          }}>
            🐒
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 28,
            color: '#c9a45c',
            margin: '0 0 10px'
          }}>
            History Heritage
          </h1>
          <p style={{
            color: '#888',
            fontSize: 14,
            margin: 0
          }}>
            Enter password to access
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: 16,
                background: 'rgba(255,255,255,0.05)',
                border: error ? '2px solid #e74c3c' : '2px solid rgba(201, 164, 92, 0.3)',
                borderRadius: 10,
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            {error && (
              <p style={{
                color: '#e74c3c',
                fontSize: 13,
                marginTop: 8,
                marginBottom: 0
              }}>
                🙈 Incorrect password. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 16,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #c9a45c, #b8956d)',
              border: 'none',
              borderRadius: 10,
              color: '#1a1a2e',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            🔓 Access Site
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          color: '#555',
          fontSize: 12,
          marginTop: 20,
          marginBottom: 0
        }}>
          This site is password protected during development
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        
        @keyframes dance {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          25% { 
            transform: translateY(-20px) rotate(-15deg); 
          }
          50% { 
            transform: translateY(0) rotate(0deg); 
          }
          75% { 
            transform: translateY(-20px) rotate(15deg); 
          }
        }
      `}</style>
    </div>
  );
};

export default PasswordProtection;
