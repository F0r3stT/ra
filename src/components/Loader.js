import React from 'react';

function Loader() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '550px',
      background: '#1a1e24'
    }}>
      <img 
        src="/images/croc.gif" 
        alt="loading"
        style={{
          maxWidth: '350px',
          width: '100%',
          height: 'auto',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          animation: 'spin 4s linear infinite'
        }}
      />
      <div style={{
        marginTop: '60px',
        color: '#ffaa44',
        fontSize: '20px',
        fontWeight: 'bold',
        letterSpacing: '2px'
      }}>
        ЗАГРУЗКА...
      </div>
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

export default Loader;