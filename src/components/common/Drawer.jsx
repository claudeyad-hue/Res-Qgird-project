import React, { useEffect } from 'react';

export default function Drawer({ isOpen, onClose, title, children, actions }) {
  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`scrim ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`drawer ${isOpen ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Detail Drawer'}
      >
        <div className="drawer-head">
          <h3>{title}</h3>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {actions && <div className="drawer-actions">{actions}</div>}
      </div>
    </>
  );
}
