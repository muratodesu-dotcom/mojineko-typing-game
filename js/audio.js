// Chiptune-style WebAudio synth for game feedback. No assets required.
const Sfx = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;
  let volume = 0.6;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = volume;
        master.connect(ctx.destination);
      } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Square/triangle blip with a fast decay, the classic 8-bit envelope.
  function blip(freq, dur, type = 'square', gain = 0.08, when = 0, slide = 0) {
    const c = ensure();
    if (!c || !enabled) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime + when;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.004);
    g.gain.setValueAtTime(gain, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // Short noise burst for misses.
  function noise(dur, gain = 0.05, when = 0) {
    const c = ensure();
    if (!c || !enabled) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(g).connect(master);
    src.start(c.currentTime + when);
  }

  const arp = (notes, step, dur, type = 'square', gain = 0.05, when = 0) =>
    notes.forEach((f, i) => blip(f, dur, type, gain, when + i * step));

  return {
    setEnabled(v) { enabled = !!v; },
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (master) master.gain.value = volume; },
    unlock() { ensure(); },
    hit(combo = 0) { blip(660 + Math.min(combo, 60) * 10, 0.05, 'square', 0.035); },
    miss() { blip(110, 0.16, 'square', 0.05, 0, -50); noise(0.12, 0.03); },
    sentence() { arp([523, 784], 0.07, 0.1, 'square', 0.045); },
    milestone() { arp([523, 659, 784, 1047], 0.06, 0.12, 'square', 0.04); },
    countdown() { blip(440, 0.08, 'square', 0.05); },
    go() { arp([659, 880], 0.08, 0.16, 'square', 0.06); },
    finish() { arp([523, 659, 784, 1047, 1319], 0.09, 0.22, 'triangle', 0.06); },
    record() { arp([784, 988, 1175, 1568, 1976, 2349], 0.08, 0.26, 'square', 0.04, 0.5); },
    purr() { arp([440, 554, 659], 0.07, 0.1, 'triangle', 0.05); },
    levelUp() { arp([392, 523, 659, 784, 1047], 0.07, 0.2, 'square', 0.05); },
  };
})();
