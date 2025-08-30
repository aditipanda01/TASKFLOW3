'use client';

import { useDroppable } from '@dnd-kit/core';

export function Trash({ children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'trash',
  });

  const style = {
    opacity: isOver ? 1 : 0.5,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}
