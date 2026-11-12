import React, { useEffect } from 'react';
import { lockBodyScroll } from '../../utils/bodyScrollLock';

export default function Drawer({
  isOpen,
  onClose,
  title,
  id,
  children,
  actions,
  scrim = 'always', // 'always' | 'mobile-only' | 'none'
  className = '',
}) {
  // Close drawer on Escape key
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

  const showScrim = isOpen && scrim !== 'none';
  const scrimClasses = `scrim ${showScrim ? 'show' : ''} ${scrim === 'mobile-only' ? 'scrim-mobile-only' : ''}`.trim();

  return (
    <>
      <div
        className={scrimClasses}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`drawer ${isOpen ? 'show' : ''} ${className}`.trim()}
        id={id}
        role="dialog"
        aria-modal={scrim !== 'mobile-only'}
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
