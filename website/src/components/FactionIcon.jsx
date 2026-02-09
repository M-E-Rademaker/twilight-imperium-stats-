import React from 'react';

const FactionIcon = ({ factionShort, size = 24, className = '' }) => {
  if (!factionShort) return null;

  return (
    <img
      src={`/icons/faction_icons/${factionShort}.png`}
      alt={factionShort}
      className={`object-contain inline-block ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
};

export default FactionIcon;
