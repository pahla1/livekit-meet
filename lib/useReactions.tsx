'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  RoomEvent,
  type DataPacket_Kind,
  type LocalParticipant,
  type RemoteParticipant,
  type Room,
} from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

const REACTION_TOPIC = 'lk-reaction';
const REACTION_EXPIRY_MS = 5000;

export interface ReactionMessage {
  emoji: string;
  timestamp: number;
  participantIdentity: string;
  participantName: string;
}

interface ActiveReaction extends ReactionMessage {
  id: string;
}

interface ReactionsState {
  activeReactions: ActiveReaction[];
  sendReaction: (emoji: string) => void;
}

let reactionCounter = 0;

const ReactionsContext = createContext<ReactionsState | null>(null);

export function ReactionsProvider({ children }: { children: React.ReactNode }) {
  const room = useRoomContext();
  const [activeReactions, setActiveReactions] = useState<ActiveReaction[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeReaction = useCallback((id: string) => {
    setActiveReactions((prev) => prev.filter((r) => r.id !== id));
    timersRef.current.delete(id);
  }, []);

  const addReaction = useCallback(
    (msg: ReactionMessage) => {
      const id = `${msg.participantIdentity}-${msg.timestamp}-${++reactionCounter}`;
      const reaction: ActiveReaction = { ...msg, id };

      setActiveReactions((prev) => [...prev, reaction]);

      const timer = setTimeout(() => removeReaction(id), REACTION_EXPIRY_MS);
      timersRef.current.set(id, timer);
    },
    [removeReaction],
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      const localParticipant = room.localParticipant;
      const msg: ReactionMessage = {
        emoji,
        timestamp: Date.now(),
        participantIdentity: localParticipant.identity,
        participantName: localParticipant.name || localParticipant.identity,
      };

      addReaction(msg);

      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(msg));
      localParticipant.publishData(data, {
        reliable: false,
        topic: REACTION_TOPIC,
      });
    },
    [room, addReaction],
  );

  useEffect(() => {
    const onDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant | LocalParticipant,
      _kind?: DataPacket_Kind,
      topic?: string,
    ) => {
      if (topic !== REACTION_TOPIC || !participant) return;

      try {
        const decoder = new TextDecoder();
        const msg = JSON.parse(decoder.decode(payload)) as ReactionMessage;
        msg.participantIdentity = participant.identity;
        msg.participantName = participant.name || participant.identity;
        addReaction(msg);
      } catch {
        // ignore malformed data
      }
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, [room, addReaction]);

  return (
    <ReactionsContext.Provider value={{ activeReactions, sendReaction }}>
      {children}
    </ReactionsContext.Provider>
  );
}

export function useReactions(): ReactionsState {
  const ctx = useContext(ReactionsContext);
  if (!ctx) throw new Error('useReactions must be used within ReactionsProvider');
  return ctx;
}
