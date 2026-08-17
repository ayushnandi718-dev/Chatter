import { create } from "zustand";

// Web Audio API Sound Synthesizer for mechanical clicks and notification chimes
function playTone(freq, type, duration, gainValue = 0.08) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(gainValue, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch {
        // Ignore audio playback errors if user hasn't interacted with DOM yet
    }
}

export const useSoundStore = create((set, get) => ({
    isSoundEnabled: localStorage.getItem("chatter-sound-enabled") !== "false",

    toggleSound: () => {
        const nextState = !get().isSoundEnabled;
        localStorage.setItem("chatter-sound-enabled", String(nextState));
        set({ isSoundEnabled: nextState });
    },

    playKeystrokeSound: () => {
        if (!get().isSoundEnabled) return;
        // Mechanical key click
        playTone(320 + Math.random() * 80, "triangle", 0.03, 0.04);
    },

    playSendSound: () => {
        if (!get().isSoundEnabled) return;
        // Ascending send chirp
        playTone(520, "sine", 0.06, 0.09);
        setTimeout(() => playTone(780, "sine", 0.1, 0.08), 50);
    },

    playReceiveSound: () => {
        if (!get().isSoundEnabled) return;
        // Soft incoming notification chime
        playTone(600, "sine", 0.08, 0.09);
        setTimeout(() => playTone(880, "sine", 0.12, 0.08), 70);
    },
}));
