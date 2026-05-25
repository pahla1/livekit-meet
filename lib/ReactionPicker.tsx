'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import popupStyles from '@/styles/EmojiPopup.module.css';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '👏', '🎉', '😮', '🔥', '😢', '👀', '💯'];

export function ReactionPicker({ onEmojiClick }: { onEmojiClick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [controlBar, setControlBar] = useState<HTMLElement | null>(null);

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

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onEmojiClick(emoji);
    },
    [onEmojiClick],
  );

  if (!controlBar) return null;

  return createPortal(
    <div style={{ position: 'relative' }}>
      {open && (
        <div className={popupStyles.popup}>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className={popupStyles.emojiBtn}
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <button
        className="lk-button"
        title="Reactions"
        onClick={() => setOpen((prev) => !prev)}
        aria-pressed={open}
      >
        😄
      </button>
    </div>,
    controlBar,
  );
}
