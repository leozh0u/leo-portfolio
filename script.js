/* Leo Zhou — portfolio interactions */

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- nav background on scroll ----------
const nav = document.getElementById("nav");
addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", scrollY > 40);
}, { passive: true });

// ---------- typewriter ----------
const roles = [
  "real-time booking engines",
  "71 KB neural networks",
  "bare-metal firmware",
  "iOS apps with camera superpowers",
  "wafer maps that retired Excel",
  "things that survive load tests",
];
const typeEl = document.getElementById("typewriter");
let roleIdx = 0, charIdx = 0, deleting = false;
function typeTick() {
  const word = roles[roleIdx];
  charIdx += deleting ? -1 : 1;
  typeEl.textContent = word.slice(0, charIdx);
  let delay = deleting ? 32 : 62;
  if (!deleting && charIdx === word.length) { delay = 1700; deleting = true; }
  else if (deleting && charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; delay = 350; }
  setTimeout(typeTick, delay);
}
if (reducedMotion) typeEl.textContent = roles[0];
else typeTick();

// ---------- hero: sticker parallax ----------
const stickers = document.querySelectorAll(".sticker");
if (!reducedMotion && matchMedia("(pointer: fine)").matches) {
  document.querySelector(".hero").addEventListener("pointermove", e => {
    const dx = e.clientX / innerWidth - 0.5;
    const dy = e.clientY / innerHeight - 0.5;
    stickers.forEach(s => {
      const d = +s.dataset.depth;
      s.style.marginLeft = `${dx * d * -10}px`;
      s.style.marginTop = `${dy * d * -10}px`;
    });
  });
}

// ---------- hero: confetti on name click ----------
const CONFETTI_COLORS = ["#e6392f", "#2b6bd9", "#2e9e5b", "#f2b705", "#7b4bd8"];
function confettiBurst(x, y, n = 60) {
  if (reducedMotion) return;
  for (let i = 0; i < n; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    document.body.appendChild(c);
    const angle = Math.random() * Math.PI * 2;
    const speed = 250 + Math.random() * 450;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 260;
    const spin = (Math.random() - 0.5) * 900;
    const anim = c.animate([
      { transform: `translate(${x}px, ${y}px) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${x + vx * 0.9}px, ${y + vy * 0.9 + 480}px) rotate(${spin}deg)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 700, easing: "cubic-bezier(0.15, 0.6, 0.4, 1)" });
    anim.onfinish = () => c.remove();
  }
}
const heroName = document.getElementById("hero-name");
heroName.addEventListener("click", e => confettiBurst(e.clientX, e.clientY));

// ---------- scroll reveal ----------
const revealObserver = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      revealObserver.unobserve(e.target);
    }
  }
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

// ---------- animated counters ----------
function animateCount(el) {
  const target = +el.dataset.count;
  const t0 = performance.now();
  function step(t) {
    const k = Math.min((t - t0) / 1400, 1);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const countObserver = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) {
      animateCount(e.target);
      countObserver.unobserve(e.target);
    }
  }
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach(el => countObserver.observe(el));

// ---------- geoguessr map: grid + plane along the arc ----------
const grid = document.querySelector(".geo-grid");
if (grid) {
  const NS = "http://www.w3.org/2000/svg";
  for (let x = 0; x <= 800; x += 80) {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x); l.setAttribute("y1", 0);
    l.setAttribute("x2", x); l.setAttribute("y2", 400);
    grid.appendChild(l);
  }
  for (let y = 0; y <= 400; y += 80) {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", 0); l.setAttribute("y1", y);
    l.setAttribute("x2", 800); l.setAttribute("y2", y);
    grid.appendChild(l);
  }
}
const arc = document.getElementById("flight-arc");
const plane = document.querySelector(".geo-plane");
if (arc && plane && !reducedMotion) {
  const total = arc.getTotalLength();
  let t = 0;
  (function fly() {
    t = (t + 0.0012) % 1;
    const p = arc.getPointAtLength(t * total);
    const p2 = arc.getPointAtLength(Math.min(t + 0.01, 1) * total);
    const angle = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;
    plane.setAttribute("transform", `translate(${p.x},${p.y}) rotate(${angle})`);
    plane.setAttribute("x", 0); plane.setAttribute("y", 0);
    requestAnimationFrame(fly);
  })();
}

// ---------- snow in the ski section ----------
const snowBox = document.querySelector(".snow");
if (snowBox && !reducedMotion) {
  const glyphs = ["❄", "❅", "•"];
  for (let i = 0; i < 36; i++) {
    const f = document.createElement("span");
    f.className = "flake";
    f.textContent = glyphs[i % glyphs.length];
    f.style.left = Math.random() * 100 + "%";
    f.style.fontSize = 8 + Math.random() * 14 + "px";
    f.style.opacity = 0.4 + Math.random() * 0.6;
    f.style.animationDuration = 7 + Math.random() * 9 + "s";
    f.style.animationDelay = -Math.random() * 16 + "s";
    snowBox.appendChild(f);
  }
}

// ---------- card tilt ----------
if (!reducedMotion && matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll("[data-tilt]").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

// ---------- scoreboard easter egg: 14-14, la belle ----------
const scoreLeft = document.getElementById("score-left");
if (scoreLeft) {
  const board = scoreLeft.closest(".scoreboard");
  board.title = "la belle";
  board.addEventListener("click", e => {
    scoreLeft.textContent = "15";
    board.querySelector(".score-time").textContent = "TOUCHÉ";
    const lamp = board.querySelector(".lamp-red");
    lamp.style.animation = "none";
    lamp.style.opacity = "1";
    const r = board.getBoundingClientRect();
    confettiBurst(e.clientX || r.left + r.width / 2, e.clientY || r.top, 40);
  }, { once: true });
}

// ---------- playable drum kit (WebAudio, no samples) ----------
let audioCtx = null;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function noiseBuffer(ac, dur) {
  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
const drums = {
  kick(ac) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.12);
    g.gain.setValueAtTime(1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.32);
  },
  snare(ac) {
    const n = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    n.buffer = noiseBuffer(ac, 0.2);
    f.type = "highpass"; f.frequency.value = 1200;
    g.gain.setValueAtTime(0.8, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
    n.connect(f).connect(g).connect(ac.destination);
    n.start();
    const o = ac.createOscillator(), og = ac.createGain();
    o.frequency.value = 190;
    og.gain.setValueAtTime(0.5, ac.currentTime);
    og.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    o.connect(og).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.12);
  },
  hat(ac) {
    const n = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    n.buffer = noiseBuffer(ac, 0.06);
    f.type = "highpass"; f.frequency.value = 7000;
    g.gain.setValueAtTime(0.45, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.055);
    n.connect(f).connect(g).connect(ac.destination);
    n.start();
  },
  crash(ac) {
    const n = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    n.buffer = noiseBuffer(ac, 1.4);
    f.type = "bandpass"; f.frequency.value = 5000; f.Q.value = 0.4;
    g.gain.setValueAtTime(0.5, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.3);
    n.connect(f).connect(g).connect(ac.destination);
    n.start();
  },
};
function hitDrum(name) {
  const btn = document.querySelector(`.drum[data-drum="${name}"]`);
  if (!btn) return;
  drums[name](ctx());
  btn.classList.add("hit");
  setTimeout(() => btn.classList.remove("hit"), 90);
}
document.querySelectorAll(".drum").forEach(btn => {
  btn.addEventListener("pointerdown", () => hitDrum(btn.dataset.drum));
});
// ---------- battle deck: deploy a card ----------
const arena = document.querySelector(".sec-arena");
const deployLine = document.getElementById("deploy-line");
let deployTimer = null;
document.querySelectorAll(".gcard").forEach(card => {
  card.addEventListener("click", () => {
    deployLine.textContent = card.dataset.cry;
    clearTimeout(deployTimer);
    deployTimer = setTimeout(() => { deployLine.innerHTML = "&nbsp;"; }, 2600);
    if (reducedMotion) return;
    const runner = document.createElement("span");
    runner.className = "runner";
    runner.textContent = card.dataset.deploy;
    arena.appendChild(runner);
    const dist = arena.offsetWidth + 160;
    const anim = runner.animate([
      { transform: "translateX(0) scaleX(-1)" },
      { transform: `translateX(${dist * 0.5}px) translateY(-30px) scaleX(-1)`, offset: 0.5 },
      { transform: `translateX(${dist}px) scaleX(-1)` },
    ], { duration: 1800, easing: "linear" });
    anim.onfinish = () => runner.remove();
  });
});

// ---------- minecraft hotbar ----------
const slots = [...document.querySelectorAll(".slot")];
const itemName = document.getElementById("item-name");
let itemNameTimer = null;
function selectSlot(i) {
  slots.forEach((s, j) => s.classList.toggle("selected", i === j));
  itemName.textContent = slots[i].dataset.item;
  itemName.classList.add("show");
  clearTimeout(itemNameTimer);
  itemNameTimer = setTimeout(() => itemName.classList.remove("show"), 1800);
}
slots.forEach((s, i) => s.addEventListener("click", () => selectSlot(i)));

const drumKeys = { k: "kick", s: "snare", h: "hat", c: "crash" };
addEventListener("keydown", e => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/input|textarea/i.test(document.activeElement?.tagName || "")) return;
  // both easter eggs only fire while the contact section is on screen,
  // so typing elsewhere stays quiet
  const contact = document.getElementById("contact").getBoundingClientRect();
  const onScreen = contact.top < innerHeight && contact.bottom > 0;
  if (!onScreen) return;
  const name = drumKeys[e.key.toLowerCase()];
  if (name) hitDrum(name);
  const digit = +e.key;
  if (digit >= 1 && digit <= slots.length) selectSlot(digit - 1);
});
