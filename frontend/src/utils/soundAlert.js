// Web Audio API Notification Sound Synthesizer for Loom PLM

let audioCtx = null;
let userInteracted = false;

// Initialize AudioContext lazily on user interaction or playback
function getAudioContext() {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// Auto-unlock AudioContext on first user click/tap anywhere in document
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    userInteracted = true;
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
  window.addEventListener("keydown", unlockAudio, { once: true, passive: true });
}

/**
 * Checks if sound is enabled in preferences (default true)
 */
export function isSoundEnabled() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem("loom_sound_enabled") !== "false";
}

/**
 * Toggles sound enabled preference
 */
export function setSoundEnabled(enabled) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("loom_sound_enabled", enabled ? "true" : "false");
  }
}

/**
 * Plays a pleasant synthesizer notification chime using the browser Web Audio API.
 * No external audio files or downloads required.
 *
 * @param {"critical" | "high" | "medium" | "low"} priority
 */
export function playNotificationSound(priority = "medium", force = false) {
  if (!force && !isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (priority === "critical" || priority === "high") {
      // 1. High/Critical alert: 3-tone bright modern harmonic chime (E5 -> A5 -> C6)
      const tones = [
        { freq: 659.25, time: now, dur: 0.16, gain: 0.28 },         // E5
        { freq: 880.00, time: now + 0.08, dur: 0.22, gain: 0.32 },   // A5
        { freq: 1046.50, time: now + 0.16, dur: 0.45, gain: 0.25 }   // C6
      ];

      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(t.freq, t.time);

        gainNode.gain.setValueAtTime(0.001, t.time);
        gainNode.gain.linearRampToValueAtTime(t.gain, t.time + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t.time + t.dur);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(t.time);
        osc.stop(t.time + t.dur);
      });
    } else {
      // 2. Normal/Medium notification: Pleasant 2-tone melodic soft chime (D5 -> G5)
      const tones = [
        { freq: 587.33, time: now, dur: 0.15, gain: 0.22 },         // D5
        { freq: 783.99, time: now + 0.07, dur: 0.35, gain: 0.26 }    // G5
      ];

      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(t.freq, t.time);

        gainNode.gain.setValueAtTime(0.001, t.time);
        gainNode.gain.linearRampToValueAtTime(t.gain, t.time + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t.time + t.dur);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(t.time);
        osc.stop(t.time + t.dur);
      });
    }
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
}
