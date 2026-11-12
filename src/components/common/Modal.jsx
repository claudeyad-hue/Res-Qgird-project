import React, { useEffect } from 'react';
import { lockBodyScroll } from '../../utils/bodyScrollLock';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const releaseBodyScroll = lockBodyScroll();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      releaseBodyScroll();
    };
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
