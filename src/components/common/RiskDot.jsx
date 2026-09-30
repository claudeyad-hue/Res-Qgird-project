import React from 'react';

export default function RiskDot({ severity, style = {}, className = '' }) {
  const dotClass = severity ? `dot-${String(severity).toLowerCase()}` : '';
  return <span className={`risk-dot ${dotClass} ${className}`.trim()} style={style} />;
}
