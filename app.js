/* ============================================================
   AquaWatch — protótipo clicável (Wear OS Concept)
   Fluxo e simulações conforme especificação do Figma.
   As telas são os PNGs exportados do Figma em /screens.
   ============================================================ */

(function () {
  "use strict";

  var DUR = 520; // duração das transições (ms) — casar com --dur no CSS

  /* ----- Definição das telas e gestos -------------------------
     gestures: left/right/up/down  -> direção do DESLIZE (o conteúdo vai
               para aquele lado). tap -> toque simples.
     Cada um aponta { to: nomeDaTela, fx: efeito }
  ------------------------------------------------------------- */
  var FLOW = {
    // Splash — 2s
    screen1: {
      img: "screens/screen1.png", label: "Screen 1 — Splash",
      auto: { to: "screen2", delay: 2000, fx: "fade" }
    },
    // Conexão — círculo girando — 8s
    screen2: {
      img: "screens/screen2.png", label: "Screen 2 — Connecting",
      spinner: true,
      auto: { to: "screen3", delay: 8000, fx: "fade" }
    },
    // Home / Saldo
    screen3: {
      img: "screens/screen3.png", label: "Screen 3 — Saldo",
      home: true,
      gestures: {
        left: { to: "screen5", fx: "slide-left" },
        tap:  { to: "screen3_1", fx: "zoom" }
      }
    },
    // Home / Saldo (detalhe) — toque volta para a 3
    screen3_1: {
      img: "screens/screen3_1.png", label: "Screen 3.1 — Saldo (detalhe)",
      gestures: {
        tap: { to: "screen3", fx: "zoom" }
      }
    },
    // Histórico
    screen5: {
      img: "screens/screen5.png", label: "Screen 5 — Histórico",
      gestures: {
        left:  { to: "screen4", fx: "slide-left" },
        right: { to: "screen3", fx: "slide-right" },
        up:    { to: "screen5_1", fx: "slide-up" }
      }
    },
    // Histórico (detalhe)
    screen5_1: {
      img: "screens/screen5_1.png", label: "Screen 5.1 — Histórico (detalhe)",
      gestures: {
        down: { to: "screen5", fx: "slide-down" }
      }
    },
    // Limite de gasto
    screen4: {
      img: "screens/screen4.png", label: "Screen 4 — Limite",
      gestures: {
        left:  { to: "screen8", fx: "slide-left" },
        right: { to: "screen5", fx: "slide-right" }
      }
    },
    // Logout
    screen8: {
      img: "screens/screen8.png", label: "Screen 8 — Logout",
      gestures: {
        right: { to: "screen4", fx: "slide-right" }
      }
    },

    // ----- Simulação 1: pagamento aprovado -----
    screen6:   { img: "screens/screen6.png",   label: "Screen 6 — Aprovado" },
    screen6_1: { img: "screens/screen6_1.png", label: "Screen 6.1 — Aprovado" },
    screen6_2: {
      img: "screens/screen6_2.png", label: "Screen 6.2 — Novo saldo",
      home: true,
      gestures: {
        left: { to: "screen5", fx: "slide-left" },
        tap:  { to: "screen3_1", fx: "zoom" }
      }
    },

    // ----- Simulação 2: pagamento recusado -----
    screen7:   { img: "screens/screen7.png",   label: "Screen 7 — Recusado" },
    screen7_1: { img: "screens/screen7_1.png", label: "Screen 7.1 — Recusado" },

    // ----- Simulação 3: acima do limite -----
    screen9: {
      img: "screens/screen9.png", label: "Screen 9 — Acima do limite",
      hotspots: [
        // "Pay anyway" (botão de cima) -> segue para sucesso
        { left: "9%", top: "49%", width: "82%", height: "20%",
          label: "Pay anyway", action: function () { simSuccess(); } },
        // "Cancel" (botão de baixo) -> volta para a Home
        { left: "7%", top: "70%", width: "86%", height: "26%",
          label: "Cancel", action: function () { goTo("screen3", "slide-down"); } }
      ]
    }
  };

  /* Efeitos de transição: transform inicial da tela que ENTRA e
     transform final da tela que SAI. */
  var FX = {
    "slide-left":  { inStart: "translateX(100%)",  out: "translateX(-100%)" },
    "slide-right": { inStart: "translateX(-100%)", out: "translateX(100%)"  },
    "slide-up":    { inStart: "translateY(100%)",  out: "translateY(-100%)" },
    "slide-down":  { inStart: "translateY(-100%)", out: "translateY(100%)"  },
    "fade":        { inStart: "scale(1)",   inOpacity: 0, out: "scale(1.02)", outOpacity: 0 },
    "zoom":        { inStart: "scale(.82)", inOpacity: 0, out: "scale(1.14)", outOpacity: 0 }
  };

  var stage = document.getElementById("stage");
  var panelButtons = Array.prototype.slice.call(document.querySelectorAll(".sim"));

  var currentName = null;
  var currentLayer = null;
  var animating = false;
  var pending = []; // timers de auto-avanço / sequências

  function clearPending() {
    pending.forEach(clearTimeout);
    pending = [];
  }
  function later(ms, fn) {
    var id = setTimeout(fn, ms);
    pending.push(id);
    return id;
  }

  function createLayer(name) {
    var cfg = FLOW[name];
    var el = document.createElement("div");
    el.className = "screen";
    el.dataset.name = name;
    el.setAttribute("data-label", cfg.label || name);

    var img = document.createElement("img");
    img.src = cfg.img;
    img.alt = cfg.label || name;
    img.draggable = false;
    el.appendChild(img);

    if (cfg.spinner) {
      var sp = document.createElement("div");
      sp.className = "spinner";
      el.appendChild(sp);
    }
    if (cfg.home) {
      var nfc = document.createElement("div");
      nfc.className = "nfc-pulse";
      el.appendChild(nfc);
    }
    if (cfg.hotspots) {
      cfg.hotspots.forEach(function (h) {
        var b = document.createElement("button");
        b.className = "hotspot";
        b.style.left = h.left;
        b.style.top = h.top;
        b.style.width = h.width;
        b.style.height = h.height;
        b.setAttribute("aria-label", h.label);
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          h.action();
        });
        el.appendChild(b);
      });
    }
    return el;
  }

  function removeStaleLayers() {
    var layers = stage.querySelectorAll(".screen");
    Array.prototype.forEach.call(layers, function (l) {
      if (l !== currentLayer) l.remove();
    });
  }

  function goTo(name, fx) {
    if (!FLOW[name]) return;
    removeStaleLayers();

    var f = FX[fx] || FX.fade;
    var incoming = createLayer(name);
    var outgoing = currentLayer;

    incoming.style.transform = f.inStart || "none";
    incoming.style.opacity = (f.inOpacity !== undefined) ? f.inOpacity : 1;
    stage.appendChild(incoming);

    // força reflow para o estado inicial valer antes de animar
    void incoming.offsetWidth;

    animating = true;
    incoming.style.transition = "transform " + DUR + "ms var(--ease), opacity " + DUR + "ms var(--ease)";
    incoming.style.transform = "none";
    incoming.style.opacity = 1;

    if (outgoing) {
      outgoing.style.transition = "transform " + DUR + "ms var(--ease), opacity " + DUR + "ms var(--ease)";
      outgoing.style.transform = f.out || "none";
      if (f.outOpacity !== undefined) outgoing.style.opacity = f.outOpacity;
    }

    currentLayer = incoming;
    currentName = name;

    if (outgoing) {
      setTimeout(function () {
        if (outgoing.parentNode && outgoing !== currentLayer) outgoing.remove();
      }, DUR + 60);
    }
    setTimeout(function () { animating = false; }, DUR);

    arrive(name);
  }

  /* Ao chegar numa tela: dispara auto-avanços e sequências de simulação */
  function arrive(name) {
    clearPending();
    var cfg = FLOW[name];

    if (cfg.auto) {
      later(cfg.auto.delay, function () { goTo(cfg.auto.to, cfg.auto.fx); });
    }

    // Simulação 1 (aprovado): 6 -> (1s) -> 6.1 -> (5s) -> 6.2
    if (name === "screen6")   later(1000, function () { goTo("screen6_1", "zoom"); });
    if (name === "screen6_1") later(5000, function () { goTo("screen6_2", "fade"); });

    // Simulação 2 (recusado): 7 -> (1s) -> 7.1 -> (5s) -> 3
    if (name === "screen7")   later(1000, function () { goTo("screen7_1", "zoom"); });
    if (name === "screen7_1") later(5000, function () { goTo("screen3", "fade"); });

    updatePanel();
  }

  /* ----- Simulações de pagamento ----------------------------- */
  function simSuccess()    { goTo("screen6", "zoom"); }
  function simReject()     { goTo("screen7", "zoom"); }
  function simAboveLimit() { goTo("screen9", "zoom"); }

  function isHome() {
    return currentName && FLOW[currentName] && FLOW[currentName].home;
  }
  function updatePanel() {
    var enabled = isHome();
    panelButtons.forEach(function (b) { b.disabled = !enabled; });
  }

  /* ----- Gestos (arraste / toque) ---------------------------- */
  var TAP_MAX = 12;   // px — abaixo disso é toque
  var SWIPE_MIN = 32; // px — acima disso é deslize
  var down = null;

  function gestureFor(dir) {
    var cfg = FLOW[currentName];
    if (!cfg || !cfg.gestures) return null;
    return cfg.gestures[dir] || null;
  }

  function doGesture(dir) {
    if (animating) return;
    var g = gestureFor(dir);
    if (g) goTo(g.to, g.fx);
  }

  stage.addEventListener("pointerdown", function (e) {
    down = { x: e.clientX, y: e.clientY, t: Date.now() };
    if (stage.setPointerCapture) {
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });

  stage.addEventListener("pointerup", function (e) {
    if (!down) return;
    var dx = e.clientX - down.x;
    var dy = e.clientY - down.y;
    down = null;

    var adx = Math.abs(dx), ady = Math.abs(dy);

    if (adx < TAP_MAX && ady < TAP_MAX) {
      doGesture("tap");
      return;
    }
    if (Math.max(adx, ady) < SWIPE_MIN) return;

    if (adx > ady) {
      doGesture(dx < 0 ? "left" : "right");
    } else {
      doGesture(dy < 0 ? "up" : "down");
    }
  });

  stage.addEventListener("pointercancel", function () { down = null; });

  /* ----- Teclado (acessibilidade / desktop) ------------------ */
  document.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "ArrowLeft":  doGesture("left");  e.preventDefault(); break;
      case "ArrowRight": doGesture("right"); e.preventDefault(); break;
      case "ArrowUp":    doGesture("up");    e.preventDefault(); break;
      case "ArrowDown":  doGesture("down");  e.preventDefault(); break;
      case "Enter":
      case " ":          doGesture("tap");   e.preventDefault(); break;
    }
  });

  /* ----- Botões do painel + coroa (restart) ------------------ */
  panelButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.disabled) return;
      var kind = b.getAttribute("data-sim");
      if (kind === "success") simSuccess();
      else if (kind === "reject") simReject();
      else if (kind === "aboveLimit") simAboveLimit();
    });
  });

  var crown = document.getElementById("crown");
  if (crown) crown.addEventListener("click", start);

  /* ----- Início ---------------------------------------------- */
  function start() {
    clearPending();
    removeStaleLayers();
    if (currentLayer) { currentLayer.remove(); currentLayer = null; }
    currentName = null;
    goTo("screen1", "fade");
  }

  start();
})();
