/**
 * Injected sandbox harness script for Playground games and mini apps.
 * Provides:
 * 1. Error telemetry (window.onerror & unhandledrejection -> parent postMessage)
 * 2. Console message forwarding (console.log/warn/error -> parent postMessage)
 * 3. Procedural Web Audio synthesizer (window.PlaygroundAudio)
 * 4. Responsive canvas auto-scaling & mobile touch controls helper (window.PlaygroundControls)
 */

export const SANDBOX_HARNESS_SCRIPT = `
(function() {
  // Prevent double injection
  if (window.__PLAYGROUND_INITIALIZED__) return;
  window.__PLAYGROUND_INITIALIZED__ = true;

  // 1. TELEMETRY: Error Interception
  window.addEventListener('error', function(event) {
    try {
      window.parent.postMessage({
        type: 'PLAYGROUND_ERROR',
        error: {
          message: event.message || 'Unknown runtime error',
          lineno: event.lineno,
          colno: event.colno,
          filename: event.filename,
          stack: event.error ? event.error.stack : null
        }
      }, '*');
    } catch(e) {}
  });

  window.addEventListener('unhandledrejection', function(event) {
    try {
      const reason = event.reason;
      window.parent.postMessage({
        type: 'PLAYGROUND_ERROR',
        error: {
          message: 'Unhandled Promise Rejection: ' + (reason && reason.message ? reason.message : String(reason)),
          stack: reason && reason.stack ? reason.stack : null
        }
      }, '*');
    } catch(e) {}
  });

  // 2. CONSOLE FORWARDING
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console)
  };

  function forwardConsole(level, args) {
    try {
      const text = Array.from(args).map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try { return JSON.stringify(arg); } catch(e) { return String(arg); }
        }
        return String(arg);
      }).join(' ');

      window.parent.postMessage({
        type: 'PLAYGROUND_CONSOLE',
        level: level,
        message: text,
        timestamp: Date.now()
      }, '*');
    } catch(e) {}
  }

  console.log = function(...args) {
    originalConsole.log(...args);
    forwardConsole('log', args);
  };
  console.warn = function(...args) {
    originalConsole.warn(...args);
    forwardConsole('warn', args);
  };
  console.error = function(...args) {
    originalConsole.error(...args);
    forwardConsole('error', args);
  };
  console.info = function(...args) {
    originalConsole.info(...args);
    forwardConsole('info', args);
  };

  // 3. PROCEDURAL WEB AUDIO SYNTHESIZER (PlaygroundAudio)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Auto-resume audio on first user action
  const resumeAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });
  window.addEventListener('touchstart', resumeAudio, { once: true });

  window.PlaygroundAudio = {
    play: function(soundType) {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      switch(soundType) {
        case 'jump':
          osc.type = 'square';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
          break;

        case 'coin':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, now); // B5
          osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;

        case 'laser':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;

        case 'hit':
        case 'explosion':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;

        case 'powerup':
          osc.type = 'sine';
          [330, 440, 550, 660].forEach((freq, i) => {
            const t = now + i * 0.06;
            osc.frequency.setValueAtTime(freq, t);
          });
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;

        case 'gameover':
          osc.type = 'sawtooth';
          [300, 260, 220, 160].forEach((freq, i) => {
            const t = now + i * 0.1;
            osc.frequency.setValueAtTime(freq, t);
          });
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          break;

        default:
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
      }
    },

    beep: function(freq = 440, duration = 0.1, type = 'sine') {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    }
  };

  // 4. CONTROLS HELPER (PlaygroundControls)
  window.PlaygroundControls = {
    keys: {},
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    simulateKey: function(key, isDown) {
      const type = isDown ? 'keydown' : 'keyup';
      const event = new KeyboardEvent(type, {
        key: key,
        code: key,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(event);
      document.dispatchEvent(event);
    }
  };

  window.addEventListener('keydown', function(e) {
    window.PlaygroundControls.keys[e.key] = true;
    window.PlaygroundControls.keys[e.code] = true;
  });
  window.addEventListener('keyup', function(e) {
    window.PlaygroundControls.keys[e.key] = false;
    window.PlaygroundControls.keys[e.code] = false;
  });

  // Signal ready to parent frame after initial render tick
  function notifyReady() {
    setTimeout(function() {
      window.parent.postMessage({ type: 'PLAYGROUND_READY' }, '*');
    }, 100);
  }

  if (document.readyState === 'complete') {
    notifyReady();
  } else {
    window.addEventListener('load', notifyReady);
  }
})();
`;

/**
 * Injects the sandbox harness script into an HTML string.
 */
export function injectSandboxHarness(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const harnessTag = `<script id="playground-harness">\n${SANDBOX_HARNESS_SCRIPT}\n</script>`;

  // Try injecting into <head>
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>\n${harnessTag}`);
  }
  // Try injecting before <html>
  if (html.includes('<html>')) {
    return html.replace('<html>', `<html>\n<head>${harnessTag}</head>`);
  }
  // Fallback: prepend to the document
  return `${harnessTag}\n${html}`;
}
