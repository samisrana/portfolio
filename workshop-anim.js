/* ================================================================
   Sami's Workshop — Animation System
   workshop-anim.js  |  loaded after workshop-bg.js

   Five animations, each behind a feature flag so any can be disabled.
   First-visit gating uses localStorage('workshop_booted').

   Animations:
     1. Boot sequence (porfolio.html only, first visit only)
     3. Hero type-in (porfolio.html only, first visit only)
     4. Module card data acquisition (any page with .module-card)
     5. Station mark activation (any page with .station-mark)
    13. Component reels rotating (any page with .bg-scene)
     A. Signal flow on circuit traces (ambient pulses on .bg-circuit)
     B. Cursor parallax (depth shift on bg layers)
     C. Section header anchor-in (scramble + underline on view)
   ================================================================ */
(function(global) {
  'use strict';

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // First-visit gating — boot+type-in only fire if this key is unset.
  var BOOT_KEY = 'workshop_booted';
  function isFirstVisit() {
    try { return !localStorage.getItem(BOOT_KEY); }
    catch (_) { return false; }
  }
  function markBooted() {
    try { localStorage.setItem(BOOT_KEY, '1'); } catch (_) {}
  }

  /* ============================================================
     1. BOOT SEQUENCE
     - Fluorescent lights flicker on (CSS animation on .bg-scene)
     - Boot console prints status lines one by one
     - Overlay fades, content fades in
     ============================================================ */
  var VISIT_KEY = 'workshop_last_visit';

  function fmtLastLogin(ts) {
    var d = new Date(parseInt(ts, 10));
    var days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    return days[d.getDay()] + ' ' + months[d.getMonth()] + ' ' + d.getDate() + ' ' +
           pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  var Boot = {
    sequence: [
      { lbl: 'POWER',       val: '12V · 3.3V',   d: 80  },
      { lbl: 'CLOCK',       val: '48.000 MHz',   d: 110 },
      { lbl: 'BUILD BENCH', val: 'MODULES LOADED', d: 120 },
      { lbl: 'IDENTITY',    val: 'AUTH OK',       d: 110 },
      { lbl: 'WORKSHOP',    val: 'ONLINE',        d: 130 }
    ],

    run: function(done) {
      // Read last visit then immediately record current visit
      var lastVisit = null;
      try { lastVisit = localStorage.getItem(VISIT_KEY); } catch(_) {}
      try { localStorage.setItem(VISIT_KEY, Date.now()); } catch(_) {}

      // Build sequence, appending last-login line if a previous visit exists
      var seq = Boot.sequence.slice();
      if (lastVisit) {
        seq.push({ lbl: 'LAST LOGIN', val: fmtLastLogin(lastVisit), d: 90 });
      }

      // Build overlay
      var overlay = document.createElement('div');
      overlay.className = 'boot-overlay';
      var console_ = document.createElement('div');
      console_.className = 'boot-console';
      console_.innerHTML = '<div class="boot-title">Workshop boot sequence</div>';
      overlay.appendChild(console_);
      document.body.appendChild(overlay);

      // Mark page state
      var html = document.documentElement;
      html.classList.add('booting');

      // Kick off light flicker on bg-scene
      setTimeout(function() { html.classList.add('boot-lights'); }, 80);

      var i = 0;
      var lines = [];
      function next() {
        if (i >= seq.length) {
          // Reveal content + fade overlay
          setTimeout(function() {
            html.classList.add('boot-content');
            overlay.classList.add('done');
            setTimeout(function() {
              overlay.parentNode && overlay.parentNode.removeChild(overlay);
              html.classList.remove('booting');
              if (done) done();
            }, 750);
          }, 220);
          return;
        }
        var step = seq[i++];
        var line = document.createElement('div');
        line.className = 'boot-line';
        line.innerHTML =
          '<span class="lbl">&gt; ' + step.lbl + '</span>' +
          '<span class="val">' + step.val + '</span>' +
          '<span class="ok">[OK]</span>';
        console_.appendChild(line);
        // Trigger reveal next frame
        requestAnimationFrame(function() {
          requestAnimationFrame(function() { line.classList.add('shown'); });
        });
        setTimeout(next, step.d + 60);
      }
      next();
    },

    runLastLogin: function() {
      var lastVisit = null;
      try { lastVisit = localStorage.getItem(VISIT_KEY); } catch(_) {}
      try { localStorage.setItem(VISIT_KEY, Date.now()); } catch(_) {}
      if (!lastVisit) return;

      var overlay = document.createElement('div');
      overlay.className = 'boot-overlay boot-overlay--slim';
      var console_ = document.createElement('div');
      console_.className = 'boot-console';
      var line = document.createElement('div');
      line.className = 'boot-line';
      line.innerHTML =
        '<span class="lbl">&gt; LAST LOGIN</span>' +
        '<span class="val">' + fmtLastLogin(lastVisit) + '</span>' +
        '<span class="ok">[OK]</span>';
      console_.appendChild(line);
      overlay.appendChild(console_);
      document.body.appendChild(overlay);

      requestAnimationFrame(function() {
        requestAnimationFrame(function() { line.classList.add('shown'); });
      });

      setTimeout(function() {
        overlay.classList.add('done');
        setTimeout(function() {
          overlay.parentNode && overlay.parentNode.removeChild(overlay);
        }, 750);
      }, 1800);
    }
  };

  /* ============================================================
     3. HERO TYPE-IN
     Replaces the inner text of .hero h1 with a typing effect.
     Preserves the <span> highlight on "Sami Rana".
     ============================================================ */
  var Type = {
    run: function() {
      var h1 = document.querySelector('.hero h1');
      if (!h1) return;
      // Capture the original DOM as a sequence of segments:
      // each segment is { text, className }.
      var segments = [];
      h1.childNodes.forEach(function(node) {
        if (node.nodeType === 3) {
          segments.push({ text: node.textContent, cls: '' });
        } else if (node.nodeName === 'BR') {
          segments.push({ text: '\n', cls: '' });
        } else if (node.nodeType === 1) {
          segments.push({
            text: node.textContent,
            cls: node.className || ''
          });
        }
      });

      // Wipe and rebuild as a single live target
      h1.innerHTML = '';
      var target = document.createElement('span');
      target.className = 'type-target';
      h1.appendChild(target);

      var caret = document.createElement('span');
      caret.className = 'type-caret';
      h1.appendChild(caret);

      // Build per-character spans, hidden initially
      var allChars = [];
      segments.forEach(function(seg) {
        if (seg.text === '\n') {
          target.appendChild(document.createElement('br'));
          return;
        }
        // Preserve the original highlight: copper applies only to chars
        // that came from the original <span> in the heading.
        var isHighlight = !!seg.cls;
        for (var i = 0; i < seg.text.length; i++) {
          var c = document.createElement('span');
          c.textContent = seg.text[i];
          c.style.opacity = '0';
          if (isHighlight) {
            c.style.color = 'var(--copper)';
          } else {
            // Neutralize the descendant `.hero h1 span` rule which
            // would otherwise paint every char copper.
            c.style.color = 'inherit';
          }
          target.appendChild(c);
          allChars.push(c);
        }
      });

      // Reveal one char at a time
      var idx = 0;
      function tick() {
        if (idx >= allChars.length) {
          caret.classList.add('done');
          return;
        }
        allChars[idx].style.opacity = '1';
        idx++;
        // Vary speed: faster after spaces, pause briefly on newlines
        var ch = allChars[idx - 1].textContent;
        var delay = ch === ' ' ? 18 : (28 + Math.random() * 22);
        setTimeout(tick, delay);
      }
      // Small initial delay so it feels like a deliberate intro
      setTimeout(tick, 200);
    }
  };

  /* ============================================================
     4. MODULE CARD DATA ACQUISITION
     When a .module-card scrolls into view, scramble its <dd> values
     for ~350ms then resolve to the real text.
     ============================================================ */
  var Acq = {
    GLYPHS: 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789µΩ#$%&@/=+-*',

    init: function() {
      var cards = document.querySelectorAll('.module-card');
      if (!cards.length) return;

      cards.forEach(function(card) {
        card.setAttribute('data-anim', 'pending');
        // Inject the sweep overlay (positioned by CSS)
        if (!card.querySelector('.acq-sweep')) {
          var sweep = document.createElement('span');
          sweep.className = 'acq-sweep';
          card.appendChild(sweep);
        }
        // Cache real values on each <dd>
        card.querySelectorAll('.spec-grid dd').forEach(function(dd) {
          dd.setAttribute('data-final', dd.textContent);
        });
      });

      // Reveal on intersection
      if (!('IntersectionObserver' in window)) {
        cards.forEach(function(c) { Acq.runOn(c); });
        return;
      }
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            io.unobserve(e.target);
            Acq.runOn(e.target);
          }
        });
      }, { threshold: 0.25 });
      cards.forEach(function(c) { io.observe(c); });
    },

    runOn: function(card) {
      card.setAttribute('data-anim', 'running');
      var dds = Array.prototype.slice.call(card.querySelectorAll('.spec-grid dd'));
      var statusEl = card.querySelector('.module-status');
      var statusFinal = statusEl ? statusEl.textContent : null;

      // Stagger each dd: scramble for ~280ms, then settle
      dds.forEach(function(dd, i) {
        var final = dd.getAttribute('data-final') || '';
        dd.textContent = '';
        setTimeout(function() {
          Acq.scrambleTo(dd, final, 280);
        }, 80 + i * 70);
      });

      // Animate the status pill briefly: "READING…" → final
      if (statusEl && statusFinal) {
        statusEl.textContent = 'READING';
        setTimeout(function() {
          statusEl.textContent = statusFinal;
          card.setAttribute('data-anim', 'done');
        }, 80 + dds.length * 70 + 320);
      } else {
        setTimeout(function() {
          card.setAttribute('data-anim', 'done');
        }, 80 + dds.length * 70 + 320);
      }
    },

    scrambleTo: function(el, target, duration) {
      var start = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - start) / duration);
        // Reveal characters left-to-right; rest are scrambled glyphs
        var revealCount = Math.floor(t * target.length);
        var out = '';
        for (var i = 0; i < target.length; i++) {
          var ch = target[i];
          if (i < revealCount || ch === ' ' || ch === '.' || ch === '·') {
            out += ch;
          } else {
            out += Acq.GLYPHS[Math.floor(Math.random() * Acq.GLYPHS.length)];
          }
        }
        el.textContent = out;
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = target;
      }
      requestAnimationFrame(frame);
    }
  };

  /* ============================================================
     5. STATION MARK ACTIVATION
     When a .station-mark enters viewport, animate label + tick sweep.
     ============================================================ */
  var Station = {
    init: function() {
      var marks = document.querySelectorAll('.station-mark');
      if (!marks.length) return;

      marks.forEach(function(m) { m.setAttribute('data-anim', 'pending'); });

      if (!('IntersectionObserver' in window)) {
        marks.forEach(function(m) { m.setAttribute('data-anim', 'done'); });
        return;
      }
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            io.unobserve(e.target);
            e.target.setAttribute('data-anim', 'running');
            setTimeout(function() {
              e.target.setAttribute('data-anim', 'done');
            }, 1200);
          }
        });
      }, { threshold: 0.4 });
      marks.forEach(function(m) { io.observe(m); });
    }
  };

  /* ============================================================
     A. SIGNAL FLOW ON CIRCUIT TRACES
     Periodically launch a small bright dot along a random trace path
     in the .bg-circuit SVG. Uses SVG <animateMotion> via JS so we can
     pick paths at runtime.
     ============================================================ */
  var Signal = {
    activeMax: 3,
    activeCount: 0,

    init: function() {
      var svg = document.querySelector('.bg-circuit svg');
      if (!svg) return;

      // Collect all viable trace paths (skip very short ones)
      var paths = Array.prototype.slice.call(
        svg.querySelectorAll('path.trace, path.trace-thick')
      ).filter(function(p) {
        try { return p.getTotalLength() > 120; }
        catch (_) { return false; }
      });
      if (!paths.length) return;

      Signal._svg = svg;
      Signal._paths = paths;
      Signal._scheduleNext();
    },

    _scheduleNext: function() {
      var delay = 900 + Math.random() * 2400;
      setTimeout(function() {
        if (Signal.activeCount < Signal.activeMax) Signal._launch();
        Signal._scheduleNext();
      }, delay);
    },

    _launch: function() {
      var svg = Signal._svg;
      var paths = Signal._paths;
      var path = paths[Math.floor(Math.random() * paths.length)];

      // Each pulse is its own <g> with a <circle> + glow + animateMotion.
      var ns = 'http://www.w3.org/2000/svg';
      var g = document.createElementNS(ns, 'g');
      g.setAttribute('class', 'signal-pulse');

      // Outer halo
      var halo = document.createElementNS(ns, 'circle');
      halo.setAttribute('r', '5');
      halo.setAttribute('class', 'signal-halo');
      // Bright core
      var core = document.createElementNS(ns, 'circle');
      core.setAttribute('r', '1.6');
      core.setAttribute('class', 'signal-core');

      g.appendChild(halo);
      g.appendChild(core);

      // motion path — clone the d attribute
      var anim = document.createElementNS(ns, 'animateMotion');
      var dur = 1.6 + Math.random() * 1.4; // 1.6–3.0s
      anim.setAttribute('dur', dur + 's');
      anim.setAttribute('fill', 'freeze');
      anim.setAttribute('rotate', 'auto');
      var mPath = document.createElementNS(ns, 'mpath');
      mPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '');
      // Need an id on the target path
      if (!path.id) path.id = 'sig-path-' + Math.random().toString(36).slice(2, 8);
      mPath.setAttribute('href', '#' + path.id);
      mPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + path.id);
      anim.appendChild(mPath);
      g.appendChild(anim);

      svg.appendChild(g);
      Signal.activeCount++;

      // Fade in via class; remove on end
      requestAnimationFrame(function() {
        g.classList.add('signal-pulse--live');
      });
      try { anim.beginElement(); } catch (_) {}

      // Cleanup
      var cleanup = function() {
        Signal.activeCount = Math.max(0, Signal.activeCount - 1);
        if (g.parentNode) g.parentNode.removeChild(g);
      };
      anim.addEventListener('endEvent', cleanup, { once: true });
      // Fallback timer in case endEvent doesn't fire
      setTimeout(cleanup, dur * 1000 + 400);
    }
  };

  /* ============================================================
     B. CURSOR PARALLAX
     Bg layers shift slightly against cursor. Different layers move
     by different amounts to imply depth.
     ============================================================ */
  var Parallax = {
    layers: [
      // [selector, max-px-x, max-px-y]
      { sel: '.bg-circuit',  ax: 10, ay: 6 },
      { sel: '.bg-scene',    ax: 6,  ay: 4 },
      { sel: '.bg-geo',      ax: 4,  ay: 3 },
      { sel: '.bg-waves',    ax: 3,  ay: 2 }
    ],
    target: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    raf: null,

    init: function() {
      // Touch devices: skip — feels weird without a hover cursor.
      if (matchMedia('(hover: none)').matches) return;

      var resolved = Parallax.layers
        .map(function(l) {
          var el = document.querySelector(l.sel);
          return el ? Object.assign({}, l, { el: el }) : null;
        })
        .filter(Boolean);
      if (!resolved.length) return;
      Parallax._resolved = resolved;

      // Mouse anywhere in the viewport
      window.addEventListener('mousemove', Parallax._onMove, { passive: true });
      Parallax._tick();
    },

    _onMove: function(e) {
      // Normalize to -0.5..0.5
      Parallax.target.x = (e.clientX / window.innerWidth)  - 0.5;
      Parallax.target.y = (e.clientY / window.innerHeight) - 0.5;
    },

    _tick: function() {
      // Lerp current toward target — gives smooth easing
      Parallax.current.x += (Parallax.target.x - Parallax.current.x) * 0.06;
      Parallax.current.y += (Parallax.target.y - Parallax.current.y) * 0.06;
      Parallax._resolved.forEach(function(l) {
        var dx = -Parallax.current.x * l.ax;
        var dy = -Parallax.current.y * l.ay;
        l.el.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
      });
      Parallax.raf = requestAnimationFrame(Parallax._tick);
    }
  };

  /* ============================================================
     C. SECTION HEADER ANCHOR-IN
     When a .section-label scrolls into view: scramble the area-code
     glyphs for ~280ms, then settle. An underline draws across right
     after.
     ============================================================ */
  var SectionLabel = {
    GLYPHS: 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789·/',

    init: function() {
      var labels = document.querySelectorAll('.section-label .area-code');
      if (!labels.length) return;

      labels.forEach(function(el) {
        el.setAttribute('data-final', el.textContent);
        var label = el.closest('.section-label');
        if (label) label.setAttribute('data-anim', 'pending');
      });

      if (!('IntersectionObserver' in window)) {
        labels.forEach(function(el) { SectionLabel.runOn(el); });
        return;
      }
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            io.unobserve(e.target);
            SectionLabel.runOn(e.target);
          }
        });
      }, { threshold: 0.4 });
      labels.forEach(function(el) { io.observe(el); });
    },

    runOn: function(el) {
      var final = el.getAttribute('data-final') || el.textContent;
      var label = el.closest('.section-label');
      if (label) label.setAttribute('data-anim', 'running');
      SectionLabel.scrambleTo(el, final, 320, function() {
        if (label) label.setAttribute('data-anim', 'done');
      });
    },

    scrambleTo: function(el, target, duration, done) {
      var start = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - start) / duration);
        var revealCount = Math.floor(t * target.length);
        var out = '';
        for (var i = 0; i < target.length; i++) {
          var ch = target[i];
          if (i < revealCount || ch === ' ' || ch === '·' || ch === "'") {
            out += ch;
          } else {
            out += SectionLabel.GLYPHS[Math.floor(Math.random() * SectionLabel.GLYPHS.length)];
          }
        }
        el.textContent = out;
        if (t < 1) requestAnimationFrame(frame);
        else { el.textContent = target; if (done) done(); }
      }
      requestAnimationFrame(frame);
    }
  };

  /* ============================================================
    13. COMPONENT REELS ROTATING
    Each reel in .bg-scene is a stacked group of three concentric
    circles. We add a rotating <g> spinner (two short arcs +
    crosshair) at each reel center to imply rotation without
    re-drawing the existing reels.
    ============================================================ */
  var Reels = {
    // Reel centers across all three pages — read from existing SVG.
    init: function() {
      var scene = document.querySelector('.bg-scene svg');
      if (!scene) return;

      // Find all "reel" centers: in porfolio.html they're at y≈284-286
      // and have three concentric circles. We use the OUTER circle
      // (largest r in 16..18 range) as the anchor.
      var circles = scene.querySelectorAll('circle.s-line');
      var seen = {};
      var reels = [];
      circles.forEach(function(c) {
        var r = parseFloat(c.getAttribute('r'));
        if (r < 14 || r > 20) return; // Only outer reel circles
        var cx = parseFloat(c.getAttribute('cx'));
        var cy = parseFloat(c.getAttribute('cy'));
        // Reel circles cluster in the back-shelf zone (y < 320)
        if (cy > 320) return;
        var key = Math.round(cx) + ',' + Math.round(cy);
        if (seen[key]) return;
        seen[key] = true;
        reels.push({ cx: cx, cy: cy, r: r });
      });

      if (!reels.length) return;

      // Build a spinner SVG group for each reel
      var ns = 'http://www.w3.org/2000/svg';
      reels.forEach(function(reel, i) {
        var g = document.createElementNS(ns, 'g');
        g.setAttribute('class', 'reel-spinner');
        // SVG transform-origin needs explicit transform-box; safer to
        // use an inner translate and rotate around (0,0).
        g.setAttribute('transform', 'translate(' + reel.cx + ' ' + reel.cy + ')');

        // Inner rotating element
        var inner = document.createElementNS(ns, 'g');
        // Two short arcs at opposite sides — looks like a spoke pattern
        var spokeR = reel.r * 0.65;
        var arc1 = document.createElementNS(ns, 'path');
        arc1.setAttribute('class', 's-line');
        arc1.setAttribute('d',
          'M ' + (-spokeR) + ' 0 A ' + spokeR + ' ' + spokeR + ' 0 0 1 ' +
          (-spokeR * 0.3) + ' ' + (-spokeR * 0.95));
        var arc2 = document.createElementNS(ns, 'path');
        arc2.setAttribute('class', 's-line');
        arc2.setAttribute('d',
          'M ' + spokeR + ' 0 A ' + spokeR + ' ' + spokeR + ' 0 0 1 ' +
          (spokeR * 0.3) + ' ' + (spokeR * 0.95));

        inner.appendChild(arc1);
        inner.appendChild(arc2);
        g.appendChild(inner);

        // Stagger duration + direction per reel
        var dur = 22 + (i % 3) * 8;          // 22s, 30s, 38s
        var reverse = (i % 2) === 1;
        g.style.setProperty('--reel-dur', dur + 's');
        if (reverse) {
          g.style.animationDirection = 'reverse';
        }
        // Apply rotation to the inner group, not the translate g
        // so the rotation stays anchored at the reel center.
        // Move the animation onto a wrapper.
        var rotor = document.createElementNS(ns, 'g');
        rotor.setAttribute('class', 'reel-spinner');
        rotor.style.setProperty('--reel-dur', dur + 's');
        if (reverse) rotor.style.animationDirection = 'reverse';
        rotor.appendChild(arc1);
        rotor.appendChild(arc2);

        g.removeChild(inner);
        g.removeAttribute('class');
        g.appendChild(rotor);

        scene.appendChild(g);
      });
    }
  };

  /* ============================================================
     ORCHESTRATION
     ============================================================ */
  var WorkshopAnim = {
    init: function(opts) {
      opts = opts || {};
      // Per-page feature flags
      var enableBoot   = !!opts.boot && isFirstVisit() && !prefersReducedMotion;
      var enableType   = !!opts.type && isFirstVisit() && !prefersReducedMotion;
      var enableAcq    = !!opts.acq;
      var enableStation = !!opts.station;
      var enableReels   = !!opts.reels;
      var enableSignal   = !!opts.signal   && !prefersReducedMotion;
      var enableParallax = !!opts.parallax && !prefersReducedMotion;
      var enableSectionLabel = !!opts.sectionLabel;

      // Reels: always safe, runs forever, cheap.
      if (enableReels && !prefersReducedMotion) {
        Reels.init();
      }

      // Acq + Station are scroll-triggered; safe to wire up immediately.
      if (enableAcq) Acq.init();
      if (enableStation) Station.init();
      if (enableSectionLabel) SectionLabel.init();

      // Ambient: signal flow + parallax start straight away.
      if (enableSignal) Signal.init();
      if (enableParallax) Parallax.init();

      if (enableBoot) {
        // Boot first; type-in starts after boot completes.
        Boot.run(function() {
          markBooted();
          if (enableType) Type.run();
        });
      } else if (!!opts.boot && !isFirstVisit() && !prefersReducedMotion) {
        // Return visit — show just the last login line.
        Boot.runLastLogin();
      } else if (enableType) {
        // No boot, but still first visit — just do the type-in.
        Type.run();
        markBooted();
      } else if (isFirstVisit()) {
        // Nothing animating — still mark booted so subsequent loads skip.
        markBooted();
      }
    },

    // Manual replay for debugging — call from console: WorkshopAnim.replay()
    replay: function() {
      try { localStorage.removeItem(BOOT_KEY); } catch (_) {}
      window.location.reload();
    }
  };

  global.WorkshopAnim = WorkshopAnim;
})(window);
