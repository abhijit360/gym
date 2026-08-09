import React from 'react';

interface SwipeableRowProps {
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({ onDelete, children }: SwipeableRowProps) {
  // TODO: implement with react-native-gesture-handler Swipeable after Phase 3 installs deps
  // For now, just render children (delete via long-press or detail screen)
  return <>{children}</>;
}
