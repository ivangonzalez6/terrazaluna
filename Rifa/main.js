/* ============================================================
   RIFA POR SUS SUEÑOS — main.js  v2  (Supabase + Claude Vision)
   ============================================================ */
(function () {
  "use strict";

  /* ── SUPABASE ──────────────────────────────────────────────── */
  var SB = "https://biuaxkpyujypiigxolwt.supabase.co";
  var SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdWF4a3B5dWp5cGlpZ3hvbHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDY1ODUsImV4cCI6MjA5NTQ4MjU4NX0.4MJ2WfTo6tDNImcN0E5RCy4ilU2-sXnmRb6_BB85YaQ";

  function sbHeaders() {
    return { "apikey": SK, "Authorization": "Bearer " + SK, "Content-Type": "application/json" };
  }
  async function sbGet(table, filter) {
    var r = await fetch(SB + "/rest/v1/" + table + (filter || ""), { headers: sbHeaders() });
    return r.json();
  }
  async function sbPost(table, body) {
    var r = await fetch(SB + "/rest/v1/" + table, {
      method: "POST",
      headers: Object.assign({}, sbHeaders(), { "Prefer": "return=representation" }),
      body: JSON.stringify(body)
    });
    return r.json();
  }

  /* ── CONFIGURACIÓN ────────────────────────────────────────── */
  var CONFIG = {
    whatsappNumber: "527761148786",
    clabe: "012650015036728527",
    card:  "4152314300987511",
    // Domingo 5 julio 2026 20:00 México (UTC-5 en verano) = lunes 6 julio 01:00 UTC
    sorteoDate: new Date(Date.UTC(2026, 6, 6, 1, 0, 0)),
    precioPorBoleto: 35,
  };

  /* ── ESTADO ─────────────────────────────────────────────── */
  var selectedTickets = new Set();
  var takenTickets    = new Set();    // cargado desde Supabase

  /* ── UTILS ───────────────────────────────────────────────── */
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + (name||"?") + "]", e); } }
  function $(sel, ctx)  { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function pad(n)       { return String(n).padStart(2, "0"); }

  /* ── CARGAR BOLETOS VENDIDOS DESDE SUPABASE ─────────────── */
  async function loadTakenTickets() {
    try {
      var rows = await sbGet("rifa_purchases", "?select=ticket_numbers,status&status=neq.rechazado");
      if (!Array.isArray(rows)) return;
      rows.forEach(function (r) {
        if (Array.isArray(r.ticket_numbers)) {
          r.ticket_numbers.forEach(function (n) { takenTickets.add(n); });
        }
      });
    } catch (e) {
      console.warn("[loadTakenTickets]", e);
    }
  }

  /* ── SPLASH ─────────────────────────────────────────────── */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    function hide() { splash.classList.add("is-out"); }
    if (document.readyState === "complete") setTimeout(hide, 500);
    else window.addEventListener("load", function () { setTimeout(hide, 400); });
    setTimeout(hide, 3800);
  }

  /* ── NAV ─────────────────────────────────────────────────── */
  function initNav() {
    var nav = $("#main-nav");
    if (!nav) return;
    function onScroll() { nav.classList.toggle("is-solid", window.scrollY > 60); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── COUNTDOWN ───────────────────────────────────────────── */
  function initCountdown() {
    var daysEl  = $("#cd-days"),  hoursEl = $("#cd-hours");
    var minsEl  = $("#cd-mins"),  secsEl  = $("#cd-secs");
    if (!daysEl) return;
    function tick() {
      var diff = CONFIG.sorteoDate.getTime() - Date.now();
      if (diff <= 0) {
        [daysEl, hoursEl, minsEl, secsEl].forEach(function (e) { e.textContent = "00"; });
        return;
      }
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60), sc = s % 60;
      [[daysEl,d],[hoursEl,h],[minsEl,m],[secsEl,sc]].forEach(function(p){
        var str = pad(p[1]);
        if (p[0].textContent !== str) {
          p[0].textContent = str;
          p[0].classList.add("tick");
          setTimeout(function(){ p[0].classList.remove("tick"); }, 200);
        }
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ── REVEAL ─────────────────────────────────────────────── */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      items.forEach(function (el, i) {
        window.gsap.fromTo(el, { opacity:0, y:36 }, {
          opacity:1, y:0, duration:.75, ease:"power3.out",
          scrollTrigger: { trigger:el, start:"top 88%", toggleActions:"play none none none" },
          delay: (i % 4) * 0.07
        });
      });
    } else {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); } });
      }, { threshold:.05 });
      items.forEach(function(el){ io.observe(el); });
      setTimeout(function(){ items.forEach(function(el){ el.classList.add("is-visible"); }); }, 6000);
    }
  }

  /* ── SMOOTH SCROLL ───────────────────────────────────────── */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      var target = id && id !== "#" && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    });
  }

  /* ── TICKET GRID ─────────────────────────────────────────── */
  function buildGrid() {
    var grid = $("#ticketGrid");
    if (!grid || grid.children.length > 0) return;
    var frag = document.createDocumentFragment();
    for (var i = 1; i <= 100; i++) {
      var div = document.createElement("div");
      div.className = "ticket reveal";
      div.setAttribute("role", "checkbox");
      div.setAttribute("tabindex", "0");
      div.setAttribute("data-num", i);
      if (takenTickets.has(i)) {
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
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTicketClick.call(this); }
        });
      }
      frag.appendChild(div);
    }
    grid.appendChild(frag);

    // Stagger reveal
    $$(".ticket", grid).forEach(function (t, idx) {
      setTimeout(function () { t.classList.add("is-visible"); }, idx * 6);
    });

    updateStats();
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

  function markAsTaken(nums) {
    nums.forEach(function (n) {
      takenTickets.add(n);
      selectedTickets.delete(n);
      var el = document.querySelector('[data-num="' + n + '"]');
      if (el) {
        el.classList.remove("selected");
        el.classList.add("taken");
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("aria-label", "Boleto #" + n + " — vendido");
        el.innerHTML = "<span>" + pad(n) + "</span>";
        el.removeEventListener("click", onTicketClick);
      }
    });
    updateStats();
    updateSelectedDisplay();
    syncTicketsToForm();
  }

  function updateStats() {
    var taken = takenTickets.size;
    var avail = 100 - taken;
    var pct   = (taken / 100) * 100;
    // Hero
    var hv = $("#hero-vendidos");    if (hv) hv.textContent = taken;
    var hd = $("#hero-disponibles"); if (hd) hd.textContent = avail;
    // Section
    var sv = $("#stats-vendidos");    if (sv) sv.textContent = taken;
    var sd = $("#stats-disponibles"); if (sd) sd.textContent = avail;
    // Bars
    $$(".progress-bar-fill").forEach(function (f) { f.style.width = pct + "%"; });
    // ARIA
    $$("[role='progressbar']").forEach(function(p){ p.setAttribute("aria-valuenow", taken); });
  }

  function updateSelectedDisplay() {
    var numbersEl = $("#selectedNumbers");
    var totalEl   = $("#selectedTotal");
    var btnReg    = $("#btnRegistrar");
    if (!numbersEl) return;
    var nums = Array.from(selectedTickets).sort(function (a, b) { return a - b; });
    if (nums.length === 0) {
      numbersEl.textContent = "Ninguno";
      if (totalEl) totalEl.textContent = "";
      if (btnReg)  btnReg.classList.remove("visible");
    } else {
      numbersEl.textContent = nums.map(function (n) { return "#" + pad(n); }).join(", ");
      var total = nums.length * CONFIG.precioPorBoleto;
      if (totalEl) {
        totalEl.textContent = "Total: $" + total + " pesos · " + nums.length + " boleto" + (nums.length > 1 ? "s" : "");
      }
      if (btnReg)  btnReg.classList.add("visible");
    }
  }

  function syncTicketsToForm() {
    var input = $("#fieldTickets");
    if (!input) return;
    var nums = Array.from(selectedTickets).sort(function (a, b) { return a - b; });
    input.value = nums.length ? nums.map(function (n) { return "#" + pad(n); }).join(", ") : "";
  }

  /* ── LUCKY BUTTON ────────────────────────────────────────── */
  function initLuckyButton() {
    var btn = $("#btnLucky");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var available = [];
      $$(".ticket:not(.taken):not(.selected)").forEach(function (t) {
        var n = parseInt(t.getAttribute("data-num"), 10);
        if (!isNaN(n)) available.push({ num: n, el: t });
      });
      if (!available.length) return;
      var pick = available[Math.floor(Math.random() * available.length)];
      selectedTickets.add(pick.num);
      pick.el.classList.add("selected");
      pick.el.setAttribute("aria-checked", "true");
      pick.el.scrollIntoView({ behavior: "smooth", block: "center" });
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

  /* ── COPY BUTTONS ────────────────────────────────────────── */
  function initCopyButtons() {
    function setupCopy(btnId, textId, label) {
      var btn = $("#" + btnId);
      if (!btn) return;
      btn.addEventListener("click", function () {
        var el  = $("#" + textId);
        var txt = (el ? el.textContent : "").replace(/\s/g, "");
        var me  = btn;
        function done() {
          me.textContent = "✓ ¡Copiado!";
          me.classList.add("copied");
          setTimeout(function () { me.textContent = "📋 Copiar " + label; me.classList.remove("copied"); }, 2000);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(done).catch(function () { fallbackCopy(txt); done(); });
        } else { fallbackCopy(txt); done(); }
      });
    }
    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
    setupCopy("btnCopyClabe", "clabeText", "CLABE");
    setupCopy("btnCopyCard",  "cardText",  "tarjeta");
  }

  /* ── FILE INPUT ──────────────────────────────────────────── */
  function initFileInput() {
    var input   = $("#fieldReceipt");
    var labelEl = $("#fileLabelEl");
    var nameEl  = $("#fileNameDisplay");
    if (!input) return;
    input.addEventListener("change", function () {
      var file = this.files[0];
      if (file) {
        if (labelEl) labelEl.classList.add("has-file");
        if (nameEl)  nameEl.textContent = "✓ " + file.name;
      } else {
        if (labelEl) labelEl.classList.remove("has-file");
        if (nameEl)  nameEl.textContent = "";
      }
    });
  }

  /* ── PAY MODAL ──────────────────────────────────────────── */
  function initPayModal() {
    var btnOpen  = $("#btnRegistrar");
    var modal    = $("#payModal");
    var btnClose = $("#btnPayClose");
    if (!btnOpen || !modal) return;

    btnOpen.addEventListener("click", function () {
      var nums  = Array.from(selectedTickets).sort(function (a, b) { return a - b; });
      if (!nums.length) return;
      var total = nums.length * CONFIG.precioPorBoleto;
      // Actualizar resumen en modal
      var numsEl  = $("#payNumsVal");
      var totalEl = $("#payTotalVal");
      if (numsEl)  numsEl.textContent  = nums.map(function(n){ return "#"+pad(n); }).join(", ");
      if (totalEl) totalEl.textContent = "$" + total + " pesos (" + nums.length + " boleto" + (nums.length>1?"s":"") + ")";
      // Limpiar form
      var fn = $("#fieldName"); if (fn) fn.value = "";
      var fp = $("#fieldPhone"); if (fp) fp.value = "";
      var fr = $("#fieldReceipt"); if (fr) fr.value = "";
      var fl = $("#fileLabelEl"); if (fl) fl.classList.remove("has-file");
      var fd = $("#fileNameDisplay"); if (fd) fd.textContent = "";
      var fe = $("#formError"); if (fe) { fe.textContent = ""; }
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    });

    if (btnClose) {
      btnClose.addEventListener("click", closePayModal);
    }
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closePayModal();
    });
  }

  function closePayModal() {
    var modal = $("#payModal");
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
  }

  /* ── RECEIPT FORM (SUPABASE) ─────────────────────────────── */
  function initReceiptForm() {
    var btnEl  = $("#btnSubmit");
    var errEl  = $("#formError");
    if (!btnEl) return;

    btnEl.addEventListener("click", async function () {
      if (errEl) { errEl.textContent = ""; }

      var nombre = ($("#fieldName").value || "").trim();
      var phone  = ($("#fieldPhone").value || "").trim();
      var file   = ($("#fieldReceipt").files || [])[0];
      var nums   = Array.from(selectedTickets).sort(function (a, b) { return a - b; });

      // Validaciones
      if (!nombre) return showError(errEl, "Por favor escribe tu nombre completo.");
      if (!phone || phone.replace(/\D/g,"").length < 10) return showError(errEl, "Escribe tu número de WhatsApp (10 dígitos).");
      if (!nums.length) return showError(errEl, "Selecciona al menos un número de boleto.");
      if (!file)   return showError(errEl, "Adjunta la foto de tu comprobante de pago.");

      var total = nums.length * CONFIG.precioPorBoleto;

      setBtnLoading(btnEl, true, "Subiendo comprobante…");

      try {
        // 1. Subir imagen al bucket
        var ext   = file.name.split(".").pop().toLowerCase();
        var fname = "comp_" + Date.now() + "_" + Math.random().toString(36).slice(2) + "." + ext;
        var upRes = await fetch(SB + "/storage/v1/object/rifa-comprobantes/" + fname, {
          method: "POST",
          headers: { "apikey": SK, "Authorization": "Bearer " + SK, "Content-Type": file.type },
          body: file
        });
        var imgUrl = upRes.ok
          ? SB + "/storage/v1/object/public/rifa-comprobantes/" + fname
          : null;

        // 2. Insertar en rifa_purchases (status siempre pendiente_revision al inicio)
        var record = {
          buyer_name:     nombre,
          buyer_phone:    phone || null,
          ticket_numbers: nums,
          amount_paid:    total,
          receipt_url:    imgUrl,
          status:         "pendiente_revision"
        };
        var insertData = await sbPost("rifa_purchases", record);
        var purchaseId = Array.isArray(insertData) ? insertData[0]?.id : insertData?.id;

        // 3. Marcar boletos como tomados en el grid
        markAsTaken(nums);
        selectedTickets.clear();
        updateSelectedDisplay();
        syncTicketsToForm();

        // 4. Llamar edge function de validación (no bloqueante, en background)
        if (imgUrl && purchaseId) {
          fetch(SB + "/functions/v1/validate-rifa-receipt", {
            method: "POST",
            headers: { "apikey": SK, "Authorization": "Bearer " + SK, "Content-Type": "application/json" },
            body: JSON.stringify({
              purchase_id:    purchaseId,
              image_url:      imgUrl,
              amount:         total,
              ticket_numbers: nums
            })
          }).then(function (r) { return r.json(); }).then(function (result) {
            // Actualizar el mensaje del modal si todavía está visible
            var statusEl = $("#successStatusMsg");
            if (statusEl && result.verdict === "validado") {
              statusEl.textContent = "✅ Comprobante validado automáticamente.";
              statusEl.style.color = "#00c853";
            }
          }).catch(function () {});
        }

        // 5. Cerrar modal de pago y mostrar éxito
        closePayModal();
        setBtnLoading(btnEl, false);
        showSuccessModal(nums, total);
        var labelEl = $("#fileLabelEl"); if (labelEl) labelEl.classList.remove("has-file");
        var nameEl  = $("#fileNameDisplay"); if (nameEl) nameEl.textContent = "";

      } catch (err) {
        console.error("[receipt submit]", err);
        setBtnLoading(btnEl, false);
        showError(errEl, "Ocurrió un error al registrar tu comprobante. Intenta de nuevo o contáctanos por WhatsApp.");
      }
    });
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }

  function setBtnLoading(btn, loading, label) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? (label || "Procesando…") : "🎟️ Registrar mis boletos";
  }

  function showSuccessModal(nums, total) {
    var modal     = $("#successModal");
    var ticketsEl = $("#successTickets");
    var statusEl  = $("#successStatusMsg");
    var closeBtn  = $("#btnCloseModal");
    if (!modal) return;

    if (ticketsEl) {
      ticketsEl.innerHTML =
        "Boletos: " + nums.map(function(n){ return "<strong>#"+pad(n)+"</strong>"; }).join(", ") +
        "<br><small>Monto pagado: $" + total + " pesos</small>";
    }
    if (statusEl) {
      statusEl.textContent = "⏳ Validando comprobante — si todo está bien, tus boletos quedan confirmados automáticamente. Si requiere revisión, te avisamos por WhatsApp.";
      statusEl.style.color = "";
    }
    if (closeBtn) {
      closeBtn.onclick = function () { modal.hidden = true; };
    }
    modal.hidden = false;
    fireBigConfetti();

    // Click backdrop to close
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.hidden = true;
    }, { once: true });
  }

  /* ── FAQ ─────────────────────────────────────────────────── */
  function initFaq() {
    $$(".faq-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var expanded = this.getAttribute("aria-expanded") === "true";
        $$(".faq-q[aria-expanded='true']").forEach(function (b) {
          b.setAttribute("aria-expanded", "false");
          var a = b.nextElementSibling; if (a) a.hidden = true;
        });
        if (!expanded) {
          this.setAttribute("aria-expanded", "true");
          var ans = this.nextElementSibling; if (ans) ans.hidden = false;
        }
      });
    });
    var first = $(".faq-q");
    if (first) { first.setAttribute("aria-expanded","true"); var fa = first.nextElementSibling; if (fa) fa.hidden = false; }
  }

  /* ── CONFETTI ────────────────────────────────────────────── */
  var confettiParticles = [], confettiCanvas = null, confettiCtx = null, confettiRunning = false;
  var COLORS = ["#d63aff","#ff6b9d","#f5c518","#ffffff","#25d366","#4ade80","#38bdf8","#fb923c"];

  function initConfettiCanvas() {
    confettiCanvas = $("#confettiCanvas");
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext("2d");
    function resize() { confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight; }
    resize();
    window.addEventListener("resize", resize, { passive: true });
  }

  function Particle(x, y, big) {
    this.x=x; this.y=y;
    this.vx=(Math.random()-.5)*(big?8:5); this.vy=Math.random()*(big?-10:-6)-2;
    this.w=Math.random()*(big?12:7)+3; this.h=Math.random()*(big?7:4)+2;
    this.rot=Math.random()*Math.PI*2; this.rotV=(Math.random()-.5)*.2;
    this.color=COLORS[Math.floor(Math.random()*COLORS.length)];
    this.alpha=1; this.life=big?.012:.018; this.gravity=.2;
  }
  Particle.prototype.update = function(){
    this.vx*=.99; this.vy+=this.gravity;
    this.x+=this.vx; this.y+=this.vy;
    this.rot+=this.rotV; this.alpha-=this.life;
  };
  Particle.prototype.draw = function(ctx){
    ctx.save(); ctx.globalAlpha=Math.max(0,this.alpha);
    ctx.translate(this.x,this.y); ctx.rotate(this.rot);
    ctx.fillStyle=this.color; ctx.fillRect(-this.w/2,-this.h/2,this.w,this.h);
    ctx.restore();
  };

  function fireConfetti(sourceEl) {
    if (!confettiCanvas) return;
    var rect = sourceEl.getBoundingClientRect();
    for (var i = 0; i < 18; i++) confettiParticles.push(new Particle(rect.left+rect.width/2, rect.top+rect.height/2, false));
    if (!confettiRunning) runConfetti();
  }
  function fireBigConfetti() {
    if (!confettiCanvas) return;
    for (var i = 0; i < 120; i++) confettiParticles.push(new Particle(Math.random()*window.innerWidth, Math.random()*window.innerHeight*.5, true));
    if (!confettiRunning) runConfetti();
  }
  function runConfetti() {
    confettiRunning = true;
    function loop() {
      if (!confettiCtx) return;
      confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
      confettiParticles = confettiParticles.filter(function(p){ return p.alpha > 0; });
      confettiParticles.forEach(function(p){ p.update(); p.draw(confettiCtx); });
      if (confettiParticles.length > 0) requestAnimationFrame(loop);
      else { confettiRunning = false; confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); }
    }
    requestAnimationFrame(loop);
  }

  /* ── BOOT ────────────────────────────────────────────────── */
  async function boot() {
    safe(initSplash,         "splash");
    safe(initNav,            "nav");
    safe(initCountdown,      "countdown");
    safe(initSmoothScroll,   "scroll");
    safe(initConfettiCanvas, "confetti");
    safe(initLuckyButton,    "lucky");
    safe(initClearButton,    "clear");
    safe(initCopyButtons,    "copy");
    safe(initFileInput,      "file");
    safe(initPayModal,       "payModal");
    safe(initFaq,            "faq");

    // Cargar boletos vendidos, luego construir grid
    try { await loadTakenTickets(); } catch(e) {}
    safe(buildGrid, "grid");
    safe(initReceiptForm,  "form");
    safe(initReveals,     "reveals");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

})();
