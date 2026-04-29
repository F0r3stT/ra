import React from 'react';

function ErrorBlock({ msg, onClose }) {
  if (!msg) return null;

  return (
    <div className="error">
      <span>{msg}</span>
      {onClose && (
        <button onClick={onClose} className="close">×</button>
      )}
    </div>
  );
}

export default ErrorBlock;