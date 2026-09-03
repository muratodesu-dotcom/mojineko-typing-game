// Tiny WebAudio synth for game feedback. No assets required.
const Sfx = (() => {
  let ctx = null;
  let enabled = true;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', gain = 0.08, when = 0, slide = 0) {
    const c = ensure();
    if (!c || !enabled) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime + when;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  return {
    setEnabled(v) { enabled = !!v; },
    unlock() { ensure(); },
    hit(combo = 0) { tone(880 + Math.min(combo, 60) * 8, 0.05, 'triangle', 0.05); },
    miss() { tone(140, 0.18, 'sawtooth', 0.07, 0, -60); },
    sentence() { tone(660, 0.1, 'sine', 0.07); tone(990, 0.16, 'sine', 0.07, 0.08); },
    milestone() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.04, i * 0.06)); },
    countdown() { tone(520, 0.08, 'sine', 0.06); },
    go() { tone(780, 0.2, 'sine', 0.08); },
    finish() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, 'triangle', 0.06, i * 0.09)); },
    record() { [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, 0.3, 'triangle', 0.06, 0.5 + i * 0.1)); },
  };
})();
