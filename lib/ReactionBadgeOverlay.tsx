'use client';

import { useReactions } from './useReactions';
import styles from '@/styles/ReactionBadgeOverlay.module.css';

export function ReactionBadgeOverlay() {
  const { activeReactions } = useReactions();

  // Keep only the latest emoji per participant
  const latestByParticipant = new Map<string, string>();
  for (let i = activeReactions.length - 1; i >= 0; i--) {
    const r = activeReactions[i];
    if (!latestByParticipant.has(r.participantName)) {
      latestByParticipant.set(r.participantName, r.emoji);
    }
  }

  if (latestByParticipant.size === 0) return null;

  return (
    <div className={styles.overlay}>
      {Array.from(latestByParticipant).map(([name, emoji]) => (
        <NameBadge key={name} name={name} emoji={emoji} />
      ))}
    </div>
  );
}

function NameBadge({ name, emoji }: { name: string; emoji: string }) {
  if (typeof document === 'undefined') return null;

  // LiveKit sets data-lk-participant-name on the name element inside each tile
  const nameEl = Array.from(
    document.querySelectorAll('[data-lk-participant-name]'),
  ).find((el) => el.getAttribute('data-lk-participant-name') === name);

  if (!nameEl) return null;

  const roomContainer = nameEl.closest('.lk-room-container');
  if (!roomContainer) return null;

  const containerRect = roomContainer.getBoundingClientRect();
  const nameRect = nameEl.getBoundingClientRect();

  // Position badge right after the name text, vertically centered
  const left =
    ((nameRect.right - containerRect.left + 4) / containerRect.width) * 100;
  const top =
    ((nameRect.top + nameRect.height / 2 - containerRect.top) /
      containerRect.height) *
    100;

  return (
    <span
      className={styles.badge}
      style={{
        left: `${Math.min(left, 92)}%`,
        top: `${Math.min(top, 92)}%`,
      }}
    >
      {emoji}
    </span>
  );
}
