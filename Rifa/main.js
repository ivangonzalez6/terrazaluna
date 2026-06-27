/* ============================================================
   RIFA POR SUS SUEÑOS — main.js
   IIFE pattern — no ES modules, no imports.
   ============================================================ */
(function () {
  "use strict";

  /* ── CONFIGURACIÓN ────────────────────────────────────────────
     Personaliza estos valores según tus necesidades.
     ---------------------------------------------------------- */
  var CONFIG = {
    // PLACEHOLDER: Reemplaza con tu número de WhatsApp (con código de país, sin +)
    whatsappNumber: "52XXXXXXXXXX",

    // PLACEHOLDER: Reemplaza con tu CLABE interbancaria (sin espacios para la función de copiar)
    clabe: "000000000000000000",

    // Fecha y hora del sorteo (año, mes-1, día, hora, minuto, segundo)
    // Mexico City (UTC-6 en invierno, UTC-5 en verano)
    // Julio 3, 2026 = verano = UTC-5 → 8 PM local = 01:00 UTC del 4 de julio
    sorteoDate: new Date(Date.UTC(2026, 6, 4, 1, 0, 0)), // July 4 01:00 UTC = July 3 8PM Mexico

    // PLACEHOLDER: URL del video de las niñas (YouTube, Instagram, etc.)
    videoUrl: "https://www.youtube.com",

    // Boletos ya vendidos (ajusta según la realidad)
    ticketsTaken: new Set([3, 7, 12, 15, 18, 21, 24, 27, 33, 36, 42, 45, 51, 56, 63, 68, 72, 77, 82, 88, 91, 95, 99]),

    precioPorBoleto: 35,
  };

  /* ── ESTADO ─────────────────────────────────────────────── */
  var selectedTickets = new Set();

  /* ── UTILITARIOS ────────────────────────────────────────── */
  function safe(fn, name) {
    try { fn(); }
    catch (e) { console.warn("[" + (name || "?") + "]", e); }
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function pad(n) { return String(n).padStart(2, "0"); }

  /* ── SPLASH ─────────────────────────────────────────────── */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    function hide() { splash.classList.add("is-out"); }
    if (document.readyState === "complete") {
      setTimeout(hide, 500);
    } else {
      window.addEventListener("load", function () { setTimeout(hide, 400); });
    }
    setTimeout(hide, 3800);
  }

  /* ── NAV scrolled ────────────────────────────────────────── */
  function initNav() {
    var nav = $("#main-nav");
    if (!nav) return;
    function onScroll() {
      if (window.scrollY > 60) {
        nav.classList.add("is-solid");
      } else {
        nav.classList.remove("is-solid");
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── COUNTDOWN ───────────────────────────────────────────── */
  function initCountdown() {
    var daysEl   = $("#cd-days");
    var hoursEl  = $("#cd-hours");
    var minsEl   = $("#cd-mins");
    var secsEl   = $("#cd-secs");
    if (!daysEl) return;

    function tick() {
      var now  = Date.now();
      var diff = CONFIG.sorteoDate.getTime() - now;

      if (diff <= 0) {
        daysEl.textContent = hoursEl.textContent = minsEl.textContent = secsEl.textContent = "00";
        var label = $(".countdown-label");
        if (label) label.textContent = "🎉 ¡El sorteo ya se realizó!";
        return;
      }

      var totalSecs = Math.floor(diff / 1000);
      var d = Math.floor(totalSecs / 86400);
      var h = Math.floor((totalSecs % 86400) / 3600);
      var m = Math.floor((totalSecs % 3600) / 60);
      var s = totalSecs % 60;

      function update(el, val) {
        var str = pad(val);
        if (el.textContent !== str) {
          el.textContent = str;
          el.classList.add("tick");
          setTimeout(function () { el.classList.remove("tick"); }, 200);
        }
      }

      update(daysEl,  d);
      update(hoursEl, h);
      update(minsEl,  m);
      update(secsEl,  s);
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ── REVEAL ON SCROLL ────────────────────────────────────── */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;

    // If GSAP ScrollTrigger is available, use it
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      items.forEach(function (el, i) {
        // Skip elements with data-split (already visible via CSS)
        if (el.hasAttribute("data-split")) return;

        window.gsap.fromTo(el,
          { opacity: 0, y: 36 },
          {
            opacity: 1, y: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
            delay: (i % 4) * 0.07,
          }
        );
      });
    } else {
      // Fallback: IntersectionObserver
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.05, rootMargin: "0px 0px -5% 0px" });

      items.forEach(function (el) {
        if (!el.hasAttribute("data-split")) io.observe(el);
      });

      // 6s safety net
      setTimeout(function () {
        items.forEach(function (el) {
          if (!el.classList.contains("is-visible")) {
            el.classList.add("is-visible");
          }
        });
      }, 6000);
    }
  }

  /* ── SMOOTH SCROLL (anchor links) ───────────────────────── */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var navOffset = 80;
      var top = target.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  }

  /* ── TICKET GRID ─────────────────────────────────────────── */
  function initTicketGrid() {
    var grid = $("#ticketGrid");
    if (!grid || grid.children.length > 0) return;

    // Build 100 tickets
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= 100; i++) {
      var div = document.createElement("div");
      div.className = "ticket reveal";
      div.setAttribute("role", "checkbox");
      div.setAttribute("tabindex", "0");
      div.setAttribute("data-num", i);

      var isTaken = CONFIG.ticketsTaken.has(i);
      if (isTaken) {
        div.classList.add("taken");
        div.setAttribute("aria-checked", "false");
        div.setAttribute("aria-disabled", "true");
        div.setAttribute("aria-label", "Boleto #" + i + " — vendido");
        div.innerHTML = "<span>" + pad(i) + "</span>";
      } else {
        div.setAttribute("aria-checked", "false");
        div.setAttribute("aria-label", "Boleto #" + i + " — disponible");
        div.textContent = pad(i);
        div.addEventListener("click", onTicketClick);
        div.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTicketClick.call(this);
          }
        });
      }
      frag.appendChild(div);
    }
    grid.appendChild(frag);

    // Stagger reveal of tickets via IO
    var tickets = $$(".ticket", grid);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          // Reveal in batches
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.01 });

    tickets.forEach(function (t, idx) {
      setTimeout(function () {
        t.classList.add("is-visible");
      }, idx * 8); // 8ms stagger
    });

    updateSelectedDisplay();
  }

  function onTicketClick() {
    var num = parseInt(this.getAttribute("data-num"), 10);
    if (isNaN(num)) return;

    if (selectedTickets.has(num)) {
      selectedTickets.delete(num);
      this.classList.remove("selected");
      this.setAttribute("aria-checked", "false");
    } else {
      selectedTickets.add(num);
      this.classList.add("selected");
      this.setAttribute("aria-checked", "true");
      fireConfetti(this);
    }
    updateSelectedDisplay();
    syncTicketsToForm();
  }

  function updateSelectedDisplay() {
    var numbersEl = $("#selectedNumbers");
    var totalEl   = $("#selectedTotal");
    if (!numbersEl) return;

    var nums = Array.from(selectedTickets).sort(function (a, b) { return a - b; });

    if (nums.length === 0) {
      numbersEl.textContent = "Ninguno";
      if (totalEl) totalEl.textContent = "";
    } else {
      numbersEl.textContent = nums.map(function (n) { return "#" + pad(n); }).join(", ");
      if (totalEl) {
        var total = nums.length * CONFIG.precioPorBoleto;
        totalEl.textContent =
          nums.length === 1
            ? "Total: $" + total + " pesos · 1 boleto"
            : "Total: $" + total + " pesos · " + nums.length + " boletos";
      }
    }
  }

  function syncTicketsToForm() {
    var input = $("#fieldTickets");
    if (!input) return;
    var nums = Array.from(selectedTickets).sort(function (a, b) { return a - b; });
    input.value = nums.length
      ? nums.map(function (n) { return "#" + pad(n); }).join(", ")
      : "";
  }

  /* ── LUCKY NUMBER ────────────────────────────────────────── */
  function initLuckyButton() {
    var btn = $("#btnLucky");
    if (!btn) return;
    btn.addEventListener("click", function () {
      // Find all available tickets not taken and not selected
      var available = [];
      $$(".ticket:not(.taken):not(.selected)").forEach(function (t) {
        var n = parseInt(t.getAttribute("data-num"), 10);
        if (!isNaN(n)) available.push({ num: n, el: t });
      });
      if (!available.length) return;

      var pick = available[Math.floor(Math.random() * available.length)];
      // Deselect others first (only if user wants to pick one at a time via lucky button)
      // Actually, let them accumulate - just add one more
      selectedTickets.add(pick.num);
      pick.el.classList.add("selected");
      pick.el.setAttribute("aria-checked", "true");

      // Scroll ticket into view
      pick.el.scrollIntoView({ behavior: "smooth", block: "center" });

      // Animate the button
      btn.textContent = "🎉 ¡Boleto #" + pad(pick.num) + "!";
      setTimeout(function () { btn.textContent = "🎲 Elige por mí"; }, 2000);

      fireConfetti(pick.el);
      updateSelectedDisplay();
      syncTicketsToForm();
    });
  }

  /* ── CLEAR BUTTON ────────────────────────────────────────── */
  function initClearButton() {
    var btn = $("#btnClear");
    if (!btn) return;
    btn.addEventListener("click", function () {
      selectedTickets.clear();
      $$(".ticket.selected").forEach(function (t) {
        t.classList.remove("selected");
        t.setAttribute("aria-checked", "false");
      });
      updateSelectedDisplay();
      syncTicketsToForm();
    });
  }

  /* ── PROGRESS BAR ANIMATE ───────────────────────────────── */
  function initProgressBar() {
    var taken = CONFIG.ticketsTaken.size;
    var pct = (taken / 100) * 100;
    // Animate both progress bars (hero + boletos section)
    var fills = $$(".progress-bar-fill");
    fills.forEach(function (fill) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          fill.style.width = pct + "%";
          io.disconnect();
        }
      }, { threshold: 0.1 });
      io.observe(fill);
    });
  }

  /* ── COPY CLABE ─────────────────────────────────────────── */
  function initCopyClabe() {
    var btn = $("#btnCopyClabe");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var clabe = CONFIG.clabe.replace(/\s/g, "");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(clabe).then(function () {
          showCopied(btn);
        }).catch(function () {
          fallbackCopy(clabe, btn);
        });
      } else {
        fallbackCopy(clabe, btn);
      }
    });
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    showCopied(btn);
  }

  function showCopied(btn) {
    btn.textContent = "✓ ¡CLABE copiada!";
    btn.classList.add("copied");
    setTimeout(function () {
      btn.innerHTML = "📋 Copiar CLABE";
      btn.classList.remove("copied");
    }, 2500);
  }

  /* ── WHATSAPP FORM ───────────────────────────────────────── */
  function initWhatsAppForm() {
    var form = $("#rifaForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nombre  = ($("#fieldName").value || "").trim();
      var boletos = ($("#fieldTickets").value || "").trim();
      var phone   = ($("#fieldPhone").value || "").trim();

      if (!nombre) {
        alert("Por favor escribe tu nombre completo.");
        $("#fieldName").focus();
        return;
      }

      var nums = Array.from(selectedTickets).sort(function (a, b) { return a - b; });
      var total = nums.length * CONFIG.precioPorBoleto;

      var msg = "¡Hola! Quiero participar en la *Rifa por sus Sueños* 🌟\n\n";
      msg += "👤 *Nombre:* " + nombre + "\n";
      if (boletos) {
        msg += "🎟️ *Boleto(s):* " + boletos + "\n";
      }
      if (nums.length > 0) {
        msg += "💰 *Monto transferido:* $" + total + " pesos\n";
      }
      if (phone) {
        msg += "📱 *Mi WhatsApp:* " + phone + "\n";
      }
      msg += "\nAdjunto mi comprobante de transferencia. ✅";

      var waUrl = "https://wa.me/" + CONFIG.whatsappNumber +
        "?text=" + encodeURIComponent(msg);

      window.open(waUrl, "_blank", "noopener");

      // Party confetti
      fireBigConfetti();
    });
  }

  /* ── VIDEO PLACEHOLDER ───────────────────────────────────── */
  function initVideo() {
    var placeholder = $("#videoPlaceholder");
    if (!placeholder) return;

    function openVideo() {
      if (CONFIG.videoUrl && CONFIG.videoUrl !== "https://www.youtube.com") {
        window.open(CONFIG.videoUrl, "_blank", "noopener");
      } else {
        // PLACEHOLDER: Reemplaza CONFIG.videoUrl con la URL real del video
        alert("Próximamente: video de las bailarinas. 🎬");
      }
    }

    placeholder.addEventListener("click", openVideo);
    placeholder.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openVideo();
      }
    });
  }

  /* ── FAQ ACCORDION ───────────────────────────────────────── */
  function initFaq() {
    $$(".faq-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var expanded = this.getAttribute("aria-expanded") === "true";
        var answer = this.nextElementSibling;

        // Close all others
        $$(".faq-q[aria-expanded='true']").forEach(function (b) {
          b.setAttribute("aria-expanded", "false");
          var a = b.nextElementSibling;
          if (a) a.hidden = true;
        });

        if (!expanded) {
          this.setAttribute("aria-expanded", "true");
          if (answer) answer.hidden = false;
        }
      });
    });

    // Open first by default
    var first = $(".faq-q");
    if (first) {
      first.setAttribute("aria-expanded", "true");
      var firstA = first.nextElementSibling;
      if (firstA) firstA.hidden = false;
    }
  }

  /* ── CONFETTI ────────────────────────────────────────────── */
  var confettiParticles = [];
  var confettiCanvas = null;
  var confettiCtx = null;
  var confettiRunning = false;

  var COLORS = [
    "#d63aff", "#ff6b9d", "#f5c518", "#ffffff",
    "#25d366", "#4ade80", "#38bdf8", "#fb923c"
  ];

  function initConfettiCanvas() {
    confettiCanvas = $("#confettiCanvas");
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize, { passive: true });
  }

  function resize() {
    if (!confettiCanvas) return;
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function Particle(x, y, big) {
    this.x  = x;
    this.y  = y;
    this.vx = (Math.random() - 0.5) * (big ? 8 : 5);
    this.vy = Math.random() * -(big ? 10 : 6) - 2;
    this.w  = Math.random() * (big ? 12 : 7) + 3;
    this.h  = Math.random() * (big ? 7 : 4) + 2;
    this.rot= Math.random() * Math.PI * 2;
    this.rotV= (Math.random() - 0.5) * 0.2;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.alpha = 1;
    this.life  = big ? 0.012 : 0.018;
    this.gravity = 0.2;
  }

  Particle.prototype.update = function () {
    this.vx *= 0.99;
    this.vy += this.gravity;
    this.x  += this.vx;
    this.y  += this.vy;
    this.rot += this.rotV;
    this.alpha -= this.life;
  };

  Particle.prototype.draw = function (ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
  };

  function fireConfetti(sourceEl) {
    if (!confettiCanvas) return;
    var rect = sourceEl.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    for (var i = 0; i < 18; i++) {
      confettiParticles.push(new Particle(x, y, false));
    }
    if (!confettiRunning) runConfetti();
  }

  function fireBigConfetti() {
    if (!confettiCanvas) return;
    for (var i = 0; i < 120; i++) {
      confettiParticles.push(new Particle(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight * 0.5,
        true
      ));
    }
    if (!confettiRunning) runConfetti();
  }

  function runConfetti() {
    confettiRunning = true;
    function loop() {
      if (!confettiCtx) return;
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      confettiParticles = confettiParticles.filter(function (p) {
        return p.alpha > 0;
      });
      confettiParticles.forEach(function (p) {
        p.update();
        p.draw(confettiCtx);
      });
      if (confettiParticles.length > 0) {
        requestAnimationFrame(loop);
      } else {
        confettiRunning = false;
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }
    requestAnimationFrame(loop);
  }

  /* (no mouse-reactive mesh in this design — uses CSS animated mesh) */

  /* ── BOOT ────────────────────────────────────────────────── */
  function boot() {
    safe(initSplash,         "initSplash");
    safe(initNav,            "initNav");
    safe(initCountdown,      "initCountdown");
    safe(initSmoothScroll,   "initSmoothScroll");
    safe(initConfettiCanvas, "initConfettiCanvas");
    safe(initTicketGrid,     "initTicketGrid");
    safe(initLuckyButton,    "initLuckyButton");
    safe(initClearButton,    "initClearButton");
    safe(initProgressBar,    "initProgressBar");
    safe(initCopyClabe,      "initCopyClabe");
    safe(initWhatsAppForm,   "initWhatsAppForm");
    safe(initVideo,          "initVideo");
    safe(initFaq,            "initFaq");
    safe(initReveals,        "initReveals");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
