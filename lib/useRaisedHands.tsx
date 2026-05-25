'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  RoomEvent,
  type DataPacket_Kind,
  type LocalParticipant,
  type RemoteParticipant,
} from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

const HAND_TOPIC = 'lk-raised-hand';

interface HandMessage {
  raised: boolean;
}

interface RaisedHandsState {
  raisedHands: Set<string>;
  toggleHand: () => void;
  localRaised: boolean;
  remoteHandRaisedAt: number;
  lastRemoteHandIdentity: string | null;
}

const RaisedHandsContext = createContext<RaisedHandsState | null>(null);

export function RaisedHandsProvider({ children }: { children: React.ReactNode }) {
  const room = useRoomContext();
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [remoteHandRaisedAt, setRemoteHandRaisedAt] = useState(0);
  const [lastRemoteHandIdentity, setLastRemoteHandIdentity] = useState<string | null>(null);
  const localIsRaised = useRef(false);

  const setHand = useCallback(
    (identity: string, raised: boolean) => {
      setRaisedHands((prev) => {
        const next = new Set(prev);
        if (raised) {
          next.add(identity);
        } else {
          next.delete(identity);
        }
        return next;
      });
    },
    [],
  );

  const toggleHand = useCallback(() => {
    const local = room.localParticipant;
    const raised = !localIsRaised.current;
    localIsRaised.current = raised;
    setHand(local.identity, raised);

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ raised } satisfies HandMessage));
    local.publishData(data, { reliable: true, topic: HAND_TOPIC }).catch(console.error);
  }, [room, setHand]);

  useEffect(() => {
    const onDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant | LocalParticipant,
      _kind?: DataPacket_Kind,
      topic?: string,
    ) => {
      if (topic !== HAND_TOPIC || !participant) return;
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload)) as HandMessage;
        setHand(participant.identity, msg.raised);
        if (msg.raised && participant.identity !== room.localParticipant.identity) {
          setRemoteHandRaisedAt(Date.now());
          setLastRemoteHandIdentity(participant.identity);
        }
      } catch {
        // ignore
      }
    };

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      setRaisedHands((prev) => {
        const next = new Set(prev);
        next.delete(participant.identity);
        return next;
      });
    };

    const onParticipantConnected = () => {
      if (localIsRaised.current) {
        const encoder = new TextEncoder();
        const data = encoder.encode(
          JSON.stringify({ raised: true } satisfies HandMessage),
        );
        room.localParticipant
          .publishData(data, { reliable: true, topic: HAND_TOPIC })
          .catch(console.error);
      }
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);

    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
    };
  }, [room, setHand]);

  const localRaised = raisedHands.has(room.localParticipant.identity);

  return (
    <RaisedHandsContext.Provider value={{ raisedHands, toggleHand, localRaised, remoteHandRaisedAt, lastRemoteHandIdentity }}>
      {children}
    </RaisedHandsContext.Provider>
  );
}

export function useRaisedHands(): RaisedHandsState {
  const ctx = useContext(RaisedHandsContext);
  if (!ctx) throw new Error('useRaisedHands must be used within RaisedHandsProvider');
  return ctx;
}
