/**
 * SoundPlayer — plays notification sounds from MP3 files in public/sounds/.
 * Uses the HTMLAudioElement API for simple playback with no synthesis.
 */

const SOUNDS = {
  join: '/sounds/join.mp3',
  leave: '/sounds/leave.mp3',
  handRaise: '/sounds/hand-raise.mp3',
} as const;

export class SoundPlayer {
  private audio: HTMLAudioElement | null = null;

  private play(src: string) {
    try {
      // Reuse a single Audio element — resets and plays the new file
      if (!this.audio) {
        this.audio = new Audio();
      }
      this.audio.src = src;
      this.audio.volume = 0.6;
      this.audio.play().catch(() => {
        // Silently fail if browser blocks autoplay
      });
    } catch {
      // ignore
    }
  }

  /** Plays when a remote participant joins */
  playJoinSound() {
    this.play(SOUNDS.join);
  }

  /** Plays when a remote participant leaves */
  playLeaveSound() {
    this.play(SOUNDS.leave);
  }

  /** Plays when a remote participant raises their hand */
  playHandRaiseSound() {
    this.play(SOUNDS.handRaise);
  }
}
