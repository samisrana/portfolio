/* ================================================================
   Sami's Workshop — Background System
   Girih geometry (canvas) + Signal layer (canvas)
   Zone-aware: reads body class to tune each surface environment.

   Default  (no class)  — Main Workbench  : full Girih, all signal types
   zone-bench           — Assembly Bench  : full Girih, all signal types
   zone-log             — Lab Notebook    : sparse Girih, ambient only

   Signal layer types
   ─────────────────
   ripple   Power supply rail — near-flat sine, very low amplitude
   scope    Oscilloscope trace — sine + suppressed 3rd harmonic
   square   Digital bus / clock line
   packet   Propagating wave packet — Gaussian-windowed sine traveling L→R
   rf       Expanding arc rings — antenna / field-line radiation
   ================================================================ */
(function(global) {
  'use strict';

  // Check for reduced motion preference
  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var WorkshopBG = {
    init: function() {
      var zone = 'default';
      if (document.body.classList.contains('zone-bench')) zone = 'bench';
      if (document.body.classList.contains('zone-log'))   zone = 'log';

      // Skip animations entirely if user prefers reduced motion
      if (prefersReducedMotion) return;

      this._initGirih(zone);
      this._initWaves(zone);
    },

    _initGirih: function(zone) {
      var canvas = document.getElementById('geo-canvas');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var w, h, t = 0;

      var A = 36 * Math.PI / 180;          // 36 degrees
      var UNIT = 68;                        // perpendicular spacing between lines
      var slope_pos = Math.tan(A);          // ≈ 0.7265
      var yStep = UNIT / Math.cos(A);       // ≈ 84.1 — y-intercept step

      function resize() {
        w = canvas.width  = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }

      function draw() {
        ctx.clearRect(0, 0, w, h);
        var isLight = document.documentElement.classList.contains('light');
        var baseColor = isLight ? 'rgba(139,74,24,' : 'rgba(196,122,58,';
        var alpha = isLight ? 0.068 : 0.042;

        ctx.lineWidth = 0.9;

        var drift = (t * 0.012) % yStep;

        // --- Set 1: lines at +36° ---
        ctx.strokeStyle = baseColor + alpha + ')';
        var startB1 = -(w + 200) * slope_pos - yStep * 2 + drift;
        for (var b = startB1; b < h + yStep * 2; b += yStep) {
          ctx.beginPath();
          ctx.moveTo(-100, b + (-100) * slope_pos);
          ctx.lineTo(w + 100, b + (w + 100) * slope_pos);
          ctx.stroke();
        }

        // --- Set 2: lines at -36° ---
        ctx.strokeStyle = baseColor + alpha + ')';
        var startB2 = -yStep * 2 + drift;
        for (var b2 = startB2; b2 < h + (w + 200) * slope_pos + yStep * 2; b2 += yStep) {
          ctx.beginPath();
          ctx.moveTo(-100, b2 + (-100) * (-slope_pos));
          ctx.lineTo(w + 100, b2 + (w + 100) * (-slope_pos));
          ctx.stroke();
        }

        // --- Set 3: faint horizontal lines (wide spacing) for grid reinforcement ---
        ctx.strokeStyle = baseColor + (alpha * 0.18) + ')';
        var hStep = UNIT * 2.5;
        for (var hy = (drift * 1.5) % hStep; hy < h + hStep; hy += hStep) {
          ctx.beginPath();
          ctx.moveTo(0, hy);
          ctx.lineTo(w, hy);
          ctx.stroke();
        }

        t++;
        requestAnimationFrame(draw);
      }

      window.addEventListener('resize', resize);
      resize();
      draw();
    },

    _initWaves: function(zone) {
      var canvas = document.getElementById('wave-canvas');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var w, h, t = 0;

      // Turquoise signal color — constant across zones.
      function waveColor() {
        return document.documentElement.classList.contains('light')
          ? '22,107,96' : '46,168,154';
      }

      // Copper ambient color — for energy field layer.
      function fieldColor() {
        return document.documentElement.classList.contains('light')
          ? '139,74,24' : '196,122,58';
      }

      // ── Ambient energy field lines ─────────────────────────────────────
      // Subtle flowing curves that drift slowly across the viewport.
      // Multiple overlapping sine waves create organic interference patterns
      // resembling voltage fields or RF propagation.
      var fieldLines = [];
      var FIELD_COUNT = 6;
      for (var i = 0; i < FIELD_COUNT; i++) {
        fieldLines.push({
          yBase: (i + 0.5) / FIELD_COUNT,           // Vertical distribution
          freqA: 0.0012 + Math.random() * 0.0008,   // Primary wave frequency
          freqB: 0.0005 + Math.random() * 0.0004,   // Secondary wave frequency
          freqC: 0.0002 + Math.random() * 0.0002,   // Tertiary (slow) wave
          ampA: 15 + Math.random() * 10,            // Primary amplitude
          ampB: 8 + Math.random() * 6,              // Secondary amplitude
          ampC: 25 + Math.random() * 20,            // Tertiary amplitude
          phaseOffset: Math.random() * Math.PI * 2, // Phase offset
          speed: 0.003 + Math.random() * 0.002,     // Slow drift
          alpha: 0.045 + Math.random() * 0.025      // Low but visible opacity
        });
      }

      // ── Oscilloscope-style voltage traces ──────────────────────────────
      // Smooth analog waveforms that slowly undulate — like monitoring
      // system voltage levels or sensor outputs.
      var voltageTraces = [
        { yFrac: 0.18, freqs: [0.0018, 0.0042, 0.0009], amps: [10, 5, 15],
          phase: 0, speed: 0.004, alpha: 0.055 },
        { yFrac: 0.50, freqs: [0.0014, 0.0035, 0.0007], amps: [12, 6, 18],
          phase: 1.2, speed: 0.003, alpha: 0.065 },
        { yFrac: 0.82, freqs: [0.0020, 0.0038, 0.0010], amps: [8, 4, 14],
          phase: 2.8, speed: 0.0035, alpha: 0.050 },
      ];

      // ── RF field rings — subtle expanding arcs ─────────────────────────
      var ambientRF = [
        { xFrac: 0.08, yFrac: 0.30, maxR: 320, speed: 0.0018, count: 6, alpha: 0.035 },
        { xFrac: 0.92, yFrac: 0.65, maxR: 280, speed: 0.0014, count: 5, alpha: 0.030 },
        { xFrac: 0.45, yFrac: 0.90, maxR: 360, speed: 0.0012, count: 7, alpha: 0.025 },
      ];
      ambientRF.forEach(function(rf, i) { rf.phase = i * 0.33; });

      // Reduce ambient layers for log zone — quieter, more contemplative
      if (zone === 'log') {
        fieldLines = fieldLines.slice(0, 3);
        fieldLines.forEach(function(fl) { fl.alpha *= 0.7; });
        voltageTraces = voltageTraces.slice(0, 1);
        voltageTraces.forEach(function(vt) { vt.alpha *= 0.6; });
        ambientRF = ambientRF.slice(0, 1);
        ambientRF.forEach(function(rf) { rf.alpha *= 0.6; });
      }

      // ── Horizontal signal traces ──────────────────────────────────────
      var traces = [
        // Power supply rail ripple — barely visible, nearly flat
        { yFrac: 0.15, type: 'ripple', freq: 0.0016, amp: 4,  speed: 0.006, alpha: 0.055 },
        // Oscilloscope trace — analog signal with slow amplitude breathing
        { yFrac: 0.44, type: 'scope',  freq: 0.0052, amp: 18, speed: 0.014, alpha: 0.090 },
        // Digital clock / bus line
        { yFrac: 0.65, type: 'square', freq: 0.0085, amp: 8,  speed: 0.008, alpha: 0.060 },
        // Low-frequency sensor / integrator output
        { yFrac: 0.84, type: 'ripple', freq: 0.0019, amp: 10, speed: 0.004, alpha: 0.048 },
      ];
      if (zone === 'log') traces = [ traces[0], traces[3] ];

      // ── Wave packets — intermittent, bidirectional ────────────────────
      // Packets travel across the screen, exit, then wait a random interval
      // before the next burst. The two packets travel in opposite directions
      // at different heights — forward path and return/acknowledge path.
      var packets = [
        // Forward: left → right
        { yFrac: 0.32, vx: +0.20, carrier: 0.040, sigma: 68, amp: 15, alpha: 0.095,
          x: -280, active: true, cooldown: 0 },
        // Return:  right → left — staggered start so they don't overlap at launch
        { yFrac: 0.57, vx: -0.14, carrier: 0.030, sigma: 52, amp: 11, alpha: 0.075,
          x: 0,    active: false, cooldown: 240 },
      ];

      // ── RF arc nodes — two opposing origins ──────────────────────────
      // Left node radiates rightward; right node radiates leftward.
      // Offset phases so the expanding rings are never in sync — produces
      // the irregular, organic rhythm of actual RF interference.
      var rfNodes = [
        { xFrac: 0.06, yFrac: 0.48, facing:  0,           spread: 54,
          phase: 0.00, speed: 0.0026, count: 5, maxR: 165, alpha: 0.040 },
        { xFrac: 0.94, yFrac: 0.53, facing:  Math.PI,     spread: 54,
          phase: 0.42, speed: 0.0022, count: 4, maxR: 145, alpha: 0.032 },
      ];

      function resize() {
        w = canvas.width  = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }

      // Slow amplitude envelope applied to the scope trace.
      // Simulates system load variation — ~30 s period at 60 fps.
      function scopeBreathe() {
        return 1 + 0.07 * Math.sin(t * 0.018);
      }

      // Draw horizontal signal traces.
      function drawTraces(c) {
        var br = scopeBreathe();
        traces.forEach(function(tr) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(' + c + ',' + tr.alpha + ')';
          ctx.lineWidth = 0.75;
          var cy  = h * tr.yFrac;
          var amp = (tr.type === 'scope') ? tr.amp * br : tr.amp;
          var py  = null;
          for (var x = 0; x <= w; x++) {
            var ph = x * tr.freq + t * tr.speed;
            var y;
            if (tr.type === 'ripple') {
              y = cy + Math.sin(ph) * amp;
            } else if (tr.type === 'scope') {
              y = cy + (Math.sin(ph) * 0.87 + Math.sin(ph * 3 + 0.5) * 0.13) * amp;
            } else {
              var s = Math.sin(ph);
              y = cy + (s >= 0 ? amp : -amp);
            }
            if (py === null) {
              ctx.moveTo(x, y);
            } else {
              if (tr.type === 'square' && Math.abs(y - py) > 1) ctx.lineTo(x, py);
              ctx.lineTo(x, y);
            }
            py = y;
          }
          ctx.stroke();
        });
      }

      // Draw all active wave packets; advance cooldowns for inactive ones.
      function drawPackets(c) {
        packets.forEach(function(pkt) {
          if (!pkt.active) {
            if (--pkt.cooldown <= 0) {
              // Reactivate from the correct edge based on travel direction.
              pkt.x      = pkt.vx > 0 ? -(pkt.sigma * 3.5) : w + pkt.sigma * 3.5;
              pkt.active = true;
            }
            return;
          }

          var cy = h * pkt.yFrac;
          var x0 = Math.max(0, Math.floor(pkt.x - pkt.sigma * 3.5));
          var x1 = Math.min(w, Math.ceil( pkt.x + pkt.sigma * 3.5));

          if (x0 <= w && x1 >= 0) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(' + c + ',' + pkt.alpha + ')';
            ctx.lineWidth   = 0.85;
            var py = null;
            for (var x = x0; x <= x1; x++) {
              var dx  = x - pkt.x;
              var env = Math.exp(-(dx * dx) / (2 * pkt.sigma * pkt.sigma));
              var y   = cy + Math.sin(dx * pkt.carrier) * pkt.amp * env;
              if (py === null) ctx.moveTo(x, y); else ctx.lineTo(x, y);
              py = y;
            }
            ctx.stroke();
          }

          pkt.x += pkt.vx;

          // Deactivate when fully off-screen; set random burst interval.
          var gone = pkt.vx > 0 ? pkt.x > w + pkt.sigma * 3.5
                                 : pkt.x < -(pkt.sigma * 3.5);
          if (gone) {
            pkt.active   = false;
            // 4–14 second pause between bursts (at ~60 fps).
            pkt.cooldown = 240 + Math.floor(Math.random() * 600);
          }
        });
      }

      // Draw both RF arc nodes.
      function drawRF(c) {
        rfNodes.forEach(function(rf) {
          var ox = w * rf.xFrac;
          var oy = h * rf.yFrac;
          var sr = rf.spread * Math.PI / 180;
          for (var i = 0; i < rf.count; i++) {
            var frac = ((rf.phase + i / rf.count) % 1 + 1) % 1;
            var r    = frac * rf.maxR;
            var a    = rf.alpha * Math.sin(frac * Math.PI);
            if (a < 0.0005 || r < 2) continue;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(' + c + ',' + a.toFixed(4) + ')';
            ctx.lineWidth   = 0.6;
            ctx.arc(ox, oy, r, rf.facing - sr, rf.facing + sr);
            ctx.stroke();
          }
          rf.phase = (rf.phase + rf.speed) % 1;
        });
      }

      // ── Ambient energy field drawing ───────────────────────────────────
      // Flowing field lines with multiple sine wave interference.
      function drawEnergyField(c) {
        fieldLines.forEach(function(fl) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(' + c + ',' + fl.alpha.toFixed(4) + ')';
          ctx.lineWidth = 0.8;

          var baseY = h * fl.yBase;
          var phase = t * fl.speed + fl.phaseOffset;

          for (var x = 0; x <= w; x += 2) {
            // Combine three sine waves at different frequencies for organic flow
            var y = baseY
              + Math.sin(x * fl.freqA + phase) * fl.ampA
              + Math.sin(x * fl.freqB + phase * 0.7) * fl.ampB
              + Math.sin(x * fl.freqC + phase * 0.3) * fl.ampC;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        });
      }

      // Smooth voltage traces — oscilloscope-style waveforms.
      function drawVoltageTraces(c) {
        voltageTraces.forEach(function(vt) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(' + c + ',' + vt.alpha.toFixed(4) + ')';
          ctx.lineWidth = 1.0;

          var baseY = h * vt.yFrac;
          var phase = t * vt.speed + vt.phase;

          for (var x = 0; x <= w; x += 2) {
            // Superimpose multiple sine waves for complex waveform
            var y = baseY;
            for (var i = 0; i < vt.freqs.length; i++) {
              y += Math.sin(x * vt.freqs[i] + phase * (1 + i * 0.4)) * vt.amps[i];
            }
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        });
      }

      // Ambient RF field rings — full circles, ultra-subtle.
      function drawAmbientRF(c) {
        ambientRF.forEach(function(rf) {
          var ox = w * rf.xFrac;
          var oy = h * rf.yFrac;

          for (var i = 0; i < rf.count; i++) {
            var frac = ((rf.phase + i / rf.count) % 1 + 1) % 1;
            var r = frac * rf.maxR;
            // Fade in and out smoothly
            var a = rf.alpha * Math.sin(frac * Math.PI);
            if (a < 0.001 || r < 3) continue;

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(' + c + ',' + a.toFixed(4) + ')';
            ctx.lineWidth = 0.7;
            ctx.arc(ox, oy, r, 0, Math.PI * 2);
            ctx.stroke();
          }
          rf.phase = (rf.phase + rf.speed) % 1;
        });
      }

      function draw() {
        ctx.clearRect(0, 0, w, h);

        // Ambient energy field layer — copper tones, extremely subtle
        var fc = fieldColor();
        drawEnergyField(fc);
        drawVoltageTraces(fc);
        drawAmbientRF(fc);

        // Signal traces layer — turquoise, more visible
        var c = waveColor();
        drawTraces(c);
        if (zone !== 'log') {
          drawPackets(c);
          drawRF(c);
        }

        t += 0.18;
        requestAnimationFrame(draw);
      }

      window.addEventListener('resize', resize);
      resize();
      draw();
    }
  };

  global.WorkshopBG = WorkshopBG;

  /* ================================================================
     Tech Notes — Collapsible Documentation Panels
     Smooth expand/collapse with CSS grid animation.
     ================================================================ */
  var TechNotes = {
    init: function() {
      var notes = document.querySelectorAll('.tech-note');
      notes.forEach(function(note) {
        var trigger = note.querySelector('.tech-note-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', function() {
          var isOpen = note.hasAttribute('open');

          if (isOpen) {
            // Close
            note.removeAttribute('open');
            trigger.setAttribute('aria-expanded', 'false');
          } else {
            // Open
            note.setAttribute('open', '');
            trigger.setAttribute('aria-expanded', 'true');
          }
        });

        // Keyboard support
        trigger.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            trigger.click();
          }
        });
      });

      // Update note count in headers
      var containers = document.querySelectorAll('.tech-notes');
      containers.forEach(function(container) {
        var count = container.querySelectorAll('.tech-note').length;
        var countEl = container.querySelector('.notes-count');
        if (countEl) {
          countEl.textContent = count + ' ' + (count === 1 ? 'section' : 'sections');
        }
      });
    }
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      TechNotes.init();
    });
  } else {
    // DOM already ready, but wait for next tick to ensure elements exist
    setTimeout(TechNotes.init, 0);
  }

  global.TechNotes = TechNotes;

  /* ================================================================
     System Tabs — Engineering Interface Tabs
     Keyboard-accessible tab component with system UI styling.
     ================================================================ */
  var SysTabs = {
    init: function() {
      var tabContainers = document.querySelectorAll('.sys-tabs');

      tabContainers.forEach(function(container) {
        var tabs = container.querySelectorAll('.sys-tab');
        var panels = container.querySelectorAll('.sys-tab-panel');

        if (tabs.length === 0 || panels.length === 0) return;

        // Initialize: activate first tab if none active
        var hasActive = Array.from(tabs).some(function(tab) {
          return tab.getAttribute('aria-selected') === 'true';
        });

        if (!hasActive && tabs[0]) {
          SysTabs.activateTab(tabs[0], tabs, panels);
        }

        tabs.forEach(function(tab, index) {
          tab.addEventListener('click', function() {
            SysTabs.activateTab(tab, tabs, panels);
          });

          // Keyboard navigation
          tab.addEventListener('keydown', function(e) {
            var currentIndex = index;
            var newIndex;

            switch (e.key) {
              case 'ArrowRight':
              case 'ArrowDown':
                e.preventDefault();
                newIndex = (currentIndex + 1) % tabs.length;
                tabs[newIndex].focus();
                SysTabs.activateTab(tabs[newIndex], tabs, panels);
                break;

              case 'ArrowLeft':
              case 'ArrowUp':
                e.preventDefault();
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                tabs[newIndex].focus();
                SysTabs.activateTab(tabs[newIndex], tabs, panels);
                break;

              case 'Home':
                e.preventDefault();
                tabs[0].focus();
                SysTabs.activateTab(tabs[0], tabs, panels);
                break;

              case 'End':
                e.preventDefault();
                tabs[tabs.length - 1].focus();
                SysTabs.activateTab(tabs[tabs.length - 1], tabs, panels);
                break;
            }
          });
        });
      });
    },

    activateTab: function(selectedTab, allTabs, allPanels) {
      var targetId = selectedTab.getAttribute('aria-controls');

      // Deactivate all tabs
      allTabs.forEach(function(tab) {
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
      });

      // Deactivate all panels
      allPanels.forEach(function(panel) {
        panel.setAttribute('data-active', 'false');
      });

      // Activate selected tab
      selectedTab.setAttribute('aria-selected', 'true');
      selectedTab.setAttribute('tabindex', '0');

      // Activate corresponding panel
      var targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.setAttribute('data-active', 'true');
      }
    }
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      SysTabs.init();
    });
  } else {
    setTimeout(SysTabs.init, 0);
  }

  global.SysTabs = SysTabs;

  /* ================================================================
     Tech Tooltips — Engineering Term Definitions
     Makes .term elements keyboard-accessible and handles touch.
     ================================================================ */
  var TechTooltips = {
    init: function() {
      var terms = document.querySelectorAll('.term');

      terms.forEach(function(term) {
        // Make focusable for keyboard users
        if (!term.hasAttribute('tabindex')) {
          term.setAttribute('tabindex', '0');
        }

        // Add role for screen readers
        term.setAttribute('role', 'term');

        // Handle touch devices — toggle on tap
        term.addEventListener('touchstart', function(e) {
          e.preventDefault();

          // Close any other open tooltips
          terms.forEach(function(t) {
            if (t !== term) t.classList.remove('tip-active');
          });

          // Toggle this tooltip
          term.classList.toggle('tip-active');
        });

        // Close tooltip when clicking elsewhere
        document.addEventListener('touchstart', function(e) {
          if (!term.contains(e.target)) {
            term.classList.remove('tip-active');
          }
        });

        // Close on Escape key
        term.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            term.blur();
          }
        });
      });
    }
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      TechTooltips.init();
    });
  } else {
    setTimeout(TechTooltips.init, 0);
  }

  global.TechTooltips = TechTooltips;

})(window);
