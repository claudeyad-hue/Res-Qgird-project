import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { toast } = useApp();

  return (
    <div
      className={`toast ${toast.show ? 'show' : ''}`}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
}
