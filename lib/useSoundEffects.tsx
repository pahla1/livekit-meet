'use client';

import { useEffect, useRef } from 'react';
import { RoomEvent, type RemoteParticipant } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';
import { useRaisedHands } from '@/lib/useRaisedHands';
import { SoundPlayer } from '@/lib/sounds';

/** Join/leave sounds are muted when remote participants exceed this count. */
const MAX_PARTICIPANTS_FOR_SOUNDS = 5;

/**
 * Headless provider — plays notification sounds for participant events
 * and hand raises. No context or toggle UI needed.
 *
 * Join/leave sounds auto-mute when there are more than 6 participants total
 * (i.e. room.remoteParticipants.size > 5).
 * Hand-raise sound always plays regardless of participant count.
 */
export function SoundEffectsProvider({ children }: { children: React.ReactNode }) {
  const room = useRoomContext();
  const { remoteHandRaisedAt } = useRaisedHands();
  const playerRef = useRef(new SoundPlayer());
  const prevRemoteHandRaisedAt = useRef(remoteHandRaisedAt);

  // Play join/leave sounds on participant events
  useEffect(() => {
    const player = playerRef.current;

    const onParticipantConnected = (participant: RemoteParticipant) => {
      if (participant.identity === room.localParticipant.identity) return;
      // Auto-mute join sound in large calls
      if (room.remoteParticipants.size > MAX_PARTICIPANTS_FOR_SOUNDS) return;
      player.playJoinSound();
    };

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      if (participant.identity === room.localParticipant.identity) return;
      // Auto-mute leave sound in large calls
      if (room.remoteParticipants.size > MAX_PARTICIPANTS_FOR_SOUNDS) return;
      player.playLeaveSound();
    };

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    };
  }, [room]);

  // Play hand-raise sound when a remote participant raises their hand (always plays)
  useEffect(() => {
    const player = playerRef.current;

    if (remoteHandRaisedAt > 0 && remoteHandRaisedAt !== prevRemoteHandRaisedAt.current) {
      player.playHandRaiseSound();
    }
    prevRemoteHandRaisedAt.current = remoteHandRaisedAt;
  }, [remoteHandRaisedAt]);

  return <>{children}</>;
}
