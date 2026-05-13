import React, { useEffect } from 'react';

function Toast({ show, message, type, onClose }) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);
    
    if (!show) return null;
    
    const colors = {
        error: '#f85149',
        success: '#3fb950',
        warning: '#d29922',
        info: '#8ab4f8'
    };
    
    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: colors[type] || colors.error,
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            maxWidth: '350px'
        }}>
            <span>{message}</span>
            <button onClick={onClose} style={{
                background: 'none',
                border: 'none',
                color: 'white',
                marginLeft: '15px',
                cursor: 'pointer',
                fontSize: '16px'
            }}>×</button>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default Toast;