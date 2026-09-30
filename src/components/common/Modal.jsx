import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-label={title || 'Modal'}>
      <div className="scrim show" onClick={onClose} aria-hidden="true" />
      <div className="modal">
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
