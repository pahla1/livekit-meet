'use client';

import { useMemo } from 'react';
import { useReactions } from './useReactions';
import styles from '@/styles/ReactionOverlay.module.css';

export function ReactionOverlay() {
  const { activeReactions } = useReactions();

  return (
    <div className={styles.overlay}>
      {activeReactions.map((reaction) => (
        <FloatingEmoji key={reaction.id} reaction={reaction} />
      ))}
    </div>
  );
}

function FloatingEmoji({
  reaction,
}: {
  reaction: { id: string; emoji: string; participantIdentity: string; participantName: string };
}) {
  const position = useTilePosition(reaction.participantIdentity);
  const drift = useMemo(
    () => ({
      startX: Math.round((Math.random() - 0.5) * 60),
      endX: Math.round((Math.random() - 0.5) * 80),
    }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <span
      className={styles.emoji}
      style={{
        left: `${position.x}%`,
        bottom: `${position.bottom}%`,
        '--drift-start': `${drift.startX}px`,
        '--drift-end': `${drift.endX}px`,
      } as React.CSSProperties}
    >
      {reaction.emoji}
      <span className={styles.name}>{reaction.participantName}</span>
    </span>
  );
}

function useTilePosition(participantIdentity: string) {
  if (typeof document === 'undefined') {
    return { x: 50, bottom: 20 };
  }

  const tile = document.querySelector(
    `[data-lk-participant-identity="${participantIdentity}"]`,
  );

  if (!tile) {
    return { x: 50, bottom: 20 };
  }

  const roomContainer = tile.closest('.lk-room-container');
  if (!roomContainer) {
    return { x: 50, bottom: 20 };
  }

  const containerRect = roomContainer.getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();

  const tileCenterX =
    ((tileRect.left + tileRect.width / 2 - containerRect.left) / containerRect.width) * 100;

  const tileBottomPct =
    ((containerRect.bottom - tileRect.bottom + tileRect.height * 0.3) / containerRect.height) * 100;

  const x = Math.max(5, Math.min(95, tileCenterX));
  const bottom = Math.max(5, Math.min(80, tileBottomPct));

  return { x, bottom };
}
