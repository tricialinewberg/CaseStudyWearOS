/* ===== AquaWatch — protótipo clicável Wear OS =====
   Fluxo e simulações conforme o briefing do Figma. */
(function () {
  "use strict";

  /* Mapa de navegação por gesto.
     left/right/up/down = direção do arraste; tap = toque simples. */
  var FLOW = {
    screen1:   {},                                              // splash (auto)
    screen2:   {},                                              // conexão (auto)
    screen3:   { left: "screen5", tap: "screen3_1", home: true },
    screen3_1: { left: "screen5", tap: "screen3",  home: true },
    screen5:   { left: "screen4", right: "screen3", up: "screen5_1" },
    screen5_1: { down: "screen5" },
    screen4:   { left: "screen8", right: "screen5" },
    screen8:   { right: "screen4" },
    screen6_2: { left: "screen5", tap: "screen3",  home: true } // novo saldo = nova home
  };

  /* gesto -> efeito visual */
  var GFX = { left: "left", right: "right", up: "up", down: "down", tap: "flip" };

  /* efeito -> classes de animação (entrada/saída) */
  var FX = {
    left:  { e: "fx-eLeft",  l: "fx-lLeft"  },
    right: { e: "fx-eRight", l: "fx-lRight" },
    up:    { e: "fx-eUp",    l: "fx-lUp"    },
    down:  { e: "fx-eDown",  l: "fx-lDown"  },
    fade:  { e: "fx-eFade",  l: "fx-lFade"  },
    flip:  { e: "fx-eFlip",  l: "fx-lFlip"  },
    zoom:  { e: "fx-eZoom",  l: "fx-lFade"  },
    shake: { e: "fx-eFade",  l: "fx-lFade", shake: true }
  };

  var LOCKED = { screen1: 1, screen2: 1, screen6: 1, screen6_1: 1, screen7: 1, screen7_1: 1, screen9: 1 };
  var HOMES = { screen3: 1, screen3_1: 1, screen6_2: 1 };

  var els = {};
  var current = "screen1";
  var animating = false;
  var locked = true;
  var seq = 0;                 // token p/ cancelar sequências automáticas
  var autoTimer = null;        // auto-avanço (splash/conexão)
  var seqTimers = [];          // timers das sequências de pagamento

  var viewport, device, spinner, nfcFlash;

  function $(id) { return document.getElementById(id); }
  function clearSeq() { seqTimers.forEach(clearTimeout); seqTimers = []; }
  function sleep(ms) { return new Promise(function (r) { seqTimers.push(setTimeout(r, ms)); }); }

  /* ---- transição entre telas ---- */
  function transition(toId, fxName) {
    if (toId === current || !els[toId]) return;
    var fx = FX[fxName] || FX.fade;
    var fromEl = els[current];
    var toEl = els[toId];

    animating = true;
    if (fx.shake) { device.classList.remove("shake"); void device.offsetWidth; device.classList.add("shake"); }

    toEl.classList.add("is-active", "is-entering", fx.e);
    fromEl.classList.add(fx.l);
    current = toId;

    var finished = false;
    var fallback = setTimeout(finish, 750);
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      toEl.classList.remove("is-entering", fx.e);
      fromEl.classList.remove("is-active", fx.l);
      animating = false;
      onEnter(toId);
    }
    toEl.addEventListener("animationend", finish, { once: true });
  }

  /* ---- ao chegar em uma tela ---- */
  function onEnter(id) {
    clearTimeout(autoTimer);
    spinner.classList.toggle("show", id === "screen2");
    locked = !!LOCKED[id];

    if (id === "screen1") autoTimer = setTimeout(function () { transition("screen2", "fade"); }, 2000);
    else if (id === "screen2") autoTimer = setTimeout(function () { transition("screen3", "fade"); }, 8000);
  }

  /* ---- simulações de pagamento ---- */
  function pingNfc() {
    nfcFlash.classList.remove("ping"); void nfcFlash.offsetWidth; nfcFlash.classList.add("ping");
  }

  function runSuccess(token) {                // simulação 1
    transition("screen6", "zoom");
    sleep(1000).then(function () { if (token !== seq) return;
      transition("screen6_1", "zoom");
      return sleep(5000); }).then(function () { if (token !== seq) return;
      transition("screen6_2", "fade");
    });
  }
  function runRejected(token) {               // simulação 2
    transition("screen7", "shake");
    sleep(1000).then(function () { if (token !== seq) return;
      transition("screen7_1", "zoom");
      return sleep(5000); }).then(function () { if (token !== seq) return;
      transition("screen3", "fade");
    });
  }

  function simulate(kind) {                    // disparado pelos botões / "tap to pay"
    if (animating) return;
    var token = ++seq;
    clearSeq();
    pingNfc();
    function go() {
      if (token !== seq) return;
      if (kind === "ok") runSuccess(token);
      else if (kind === "fail") runRejected(token);
      else transition("screen9", "zoom");     // simulação 3 (acima do limite)
    }
    if (!HOMES[current]) { transition("screen3", "fade"); seqTimers.push(setTimeout(go, 520)); }
    else go();
  }

  /* ---- gestos do usuário ---- */
  function bounce(dir) {
    var bx = "0px", by = "0px";
    if (dir === "left") bx = "-7px"; else if (dir === "right") bx = "7px";
    else if (dir === "up") by = "-7px"; else if (dir === "down") by = "7px";
    viewport.style.setProperty("--bx", bx); viewport.style.setProperty("--by", by);
    viewport.classList.remove("bounce"); void viewport.offsetWidth; viewport.classList.add("bounce");
  }

  function gesture(type) {
    if (locked || animating) return;
    var node = FLOW[current];
    if (!node) return;
    var target = node[type];
    if (!target) { bounce(type); return; }
    transition(target, GFX[type] || "fade");
  }

  function restart() {
    ++seq; clearSeq(); clearTimeout(autoTimer);
    Object.keys(els).forEach(function (k) { els[k].className = "screen"; });
    els.screen1.classList.add("is-active");
    device.classList.remove("shake");
    current = "screen1";
    animating = false;
    onEnter("screen1");
  }

  /* ---- entrada por arraste / clique / teclado ---- */
  function bindGestures() {
    var sx = 0, sy = 0, tracking = false;
    var THRESH = 28;

    viewport.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".hotspot")) return;   // botões internos tratam sozinhos
      tracking = true; sx = e.clientX; sy = e.clientY;
    });
    window.addEventListener("pointerup", function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      var adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < THRESH && ady < THRESH) { gesture("tap"); return; }
      if (adx > ady) gesture(dx < 0 ? "left" : "right");
      else gesture(dy < 0 ? "up" : "down");
    });

    // botões dentro das telas (logout / pay anyway / cancel)
    viewport.addEventListener("click", function (e) {
      var hs = e.target.closest(".hotspot");
      if (!hs) return;
      e.stopPropagation();
      var action = hs.getAttribute("data-action");
      if (action === "logout") { ++seq; clearSeq(); transition("screen1", "fade"); }
      else if (action === "pay-anyway") { ++seq; clearSeq(); runSuccess(seq); }
      else if (action === "cancel") { ++seq; clearSeq(); transition("screen3", "fade"); }
    });

    // teclado
    window.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "ArrowLeft") gesture("left");
      else if (k === "ArrowRight") gesture("right");
      else if (k === "ArrowUp") { e.preventDefault(); gesture("up"); }
      else if (k === "ArrowDown") { e.preventDefault(); gesture("down"); }
      else if (k === "Enter" || k === " ") { e.preventDefault(); gesture("tap"); }
    });
  }

  function bindPanel() {
    document.querySelectorAll("[data-sim]").forEach(function (b) {
      b.addEventListener("click", function () { simulate(b.getAttribute("data-sim")); });
    });
    document.querySelectorAll('[data-action="restart"]').forEach(function (b) {
      b.addEventListener("click", restart);
    });
  }

  /* ---- init ---- */
  document.addEventListener("DOMContentLoaded", function () {
    viewport = $("viewport"); device = document.querySelector(".device");
    spinner = $("spinner"); nfcFlash = $("nfcFlash");
    document.querySelectorAll(".screen").forEach(function (s) { els[s.id] = s; });
    bindGestures();
    bindPanel();
    onEnter("screen1");   // dispara o fluxo: splash -> conexão -> home
  });
})();
