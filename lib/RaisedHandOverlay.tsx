'use client';

import { useRaisedHands } from './useRaisedHands';
import styles from '@/styles/RaisedHandOverlay.module.css';

export function RaisedHandOverlay() {
  const { raisedHands } = useRaisedHands();

  if (raisedHands.size === 0) return null;

  return (
    <div className={styles.overlay}>
      {Array.from(raisedHands).map((identity) => (
        <HandIndicator key={identity} identity={identity} />
      ))}
    </div>
  );
}

function HandIndicator({ identity }: { identity: string }) {
  if (typeof document === 'undefined') return null;

  const tile = document.querySelector(
    `[data-lk-participant-identity="${identity}"]`,
  );
  if (!tile) return null;

  const roomContainer = tile.closest('.lk-room-container');
  if (!roomContainer) return null;

  const containerRect = roomContainer.getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();

  const left =
    ((tileRect.left - containerRect.left + 12) / containerRect.width) * 100;
  const top =
    ((tileRect.top - containerRect.top + 12) / containerRect.height) * 100;

  return (
    <span
      className={styles.hand}
      style={{
        left: `${Math.min(left, 90)}%`,
        top: `${Math.min(top, 85)}%`,
      }}
    >
      ✋
    </span>
  );
}
