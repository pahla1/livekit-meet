'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRaisedHands } from './useRaisedHands';
import { useRoomContext } from '@livekit/components-react';
import styles from '@/styles/RaisedHandPopup.module.css';

export function RaisedHandPopup() {
  const { raisedHands, toggleHand, localRaised, remoteHandRaisedAt } = useRaisedHands();
  const [open, setOpen] = useState(false);
  const [controlBar, setControlBar] = useState<HTMLElement | null>(null);
  const room = useRoomContext();
  const count = raisedHands.size;

  useEffect(() => {
    const find = () => {
      const bar = document.querySelector('.lk-control-bar');
      if (bar) setControlBar(bar as HTMLElement);
    };
    find();
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Auto-open when remote participant raises hand
  useEffect(() => {
    if (remoteHandRaisedAt > 0) {
      setOpen(true);
    }
  }, [remoteHandRaisedAt]);

  // Auto-close when all hands are lowered
  useEffect(() => {
    if (count === 0 && open) {
      setOpen(false);
    }
  }, [count, open]);

  const handleToggle = useCallback(() => {
    toggleHand();
  }, [toggleHand]);

  const handlePopupToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  if (!controlBar) return null;

  const entries = Array.from(raisedHands);

  return createPortal(
    <div className={styles.btnWrapper}>
      {open && (
        <div className={styles.popup}>
          {entries.length === 0 ? (
            <div className={styles.emptyMsg}>No raised hands</div>
          ) : (
            <>
              <div className={styles.popupTitle}>Raised hands</div>
              {entries.map((identity) => {
                const participant = room.remoteParticipants.get(identity);
                const isLocal = identity === room.localParticipant.identity;
                const name = isLocal
                  ? room.localParticipant.name || 'You'
                  : participant?.name || participant?.identity || identity;

                return (
                  <div key={identity} className={styles.entry}>
                    <span className={styles.entryIcon}>✋</span>
                    <span className={styles.entryName}>{name}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
      <button
        className="lk-button"
        title={localRaised ? 'Lower hand' : 'Raise hand'}
        onClick={handleToggle}
        aria-pressed={localRaised}
      >
        ✋
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>
      {count > 0 && (
        <button
          className="lk-button"
          title="Show raised hands"
          onClick={handlePopupToggle}
          aria-pressed={open}
          style={{ padding: '0 6px', fontSize: '0.7rem' }}
        >
          ▲
        </button>
      )}
    </div>,
    controlBar,
  );
}
