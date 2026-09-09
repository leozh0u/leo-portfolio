/* Leo Zhou — portfolio interactions */

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktop = () => matchMedia("(min-width: 901px)").matches;

/* ============================================================
   World navigation — sliding track, no scroll-jacking.
   Horizontal trackpad swipe, arrows, keys, dots, nav links.
   Vertical scrolling inside a room stays native.
   ============================================================ */
const track = document.getElementById("track");
const rooms = [...document.querySelectorAll(".room")];
const progressBar = document.getElementById("progress-bar");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const edgeL = document.getElementById("edge-l");
const edgeR = document.getElementById("edge-r");
let cur = 0;

const dotsBox = document.getElementById("dots");
rooms.forEach((room, i) => {
  const d = document.createElement("button");
  d.className = "dot";
  d.setAttribute("aria-label", room.id);
  d.addEventListener("click", () => goRoom(i));
  dotsBox.appendChild(d);
});
const dots = [...dotsBox.children];

/* Rooms scroll vertically but their scrollbars are hidden, so the current room
   flags any content still below the fold. One fixed cue, not one per room —
   an absolutely positioned child would scroll away with the content. */
const scrollCue = document.createElement("p");
scrollCue.className = "scroll-cue mono";
scrollCue.setAttribute("aria-hidden", "true");
scrollCue.textContent = "↓ more";
document.body.appendChild(scrollCue);

function paintScrollCue() {
  // measure the last real block, not scrollHeight — that counts bottom padding
  // as "more to see" and would light the cue on rooms that actually fit
  const room = rooms[cur];
  const last = room && room.querySelector(".room-inner")?.lastElementChild;
  if (!last || !desktop()) { scrollCue.classList.remove("show"); return; }
  const clipped = last.getBoundingClientRect().bottom - room.getBoundingClientRect().bottom;
  scrollCue.classList.toggle("show", clipped > 24);
}
rooms.forEach(room => room.addEventListener("scroll", paintScrollCue, { passive: true }));
addEventListener("resize", paintScrollCue);
addEventListener("load", paintScrollCue);
paintScrollCue();

function paintNav() {
  dots.forEach((d, j) => d.classList.toggle("active", j === cur));
  const id = rooms[cur].id;
  navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
  progressBar.style.transform = `scaleX(${cur / (rooms.length - 1)})`;
  edgeL.classList.toggle("off", cur === 0);
  edgeR.classList.toggle("off", cur === rooms.length - 1);
}

function goRoom(i) {
  i = Math.max(0, Math.min(rooms.length - 1, i));
  cur = i;
  if (desktop()) {
    // px, not vw: keeps the shift exactly in sync with real room widths
    track.style.transform = `translateX(${-i * document.documentElement.clientWidth}px)`;
  } else {
    rooms[i].scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }
  history.replaceState(null, "", "#" + rooms[i].id);
  paintNav();
  paintScrollCue();
}

edgeL.addEventListener("click", () => goRoom(cur - 1));
edgeR.addEventListener("click", () => goRoom(cur + 1));

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const target = document.getElementById(a.getAttribute("href").slice(1));
    const idx = rooms.indexOf(target);
    if (idx !== -1) { e.preventDefault(); goRoom(idx); }
  });
});

// horizontal trackpad swipe pages between rooms; vertical wheel is untouched
let swipeAccum = 0, swipeLock = 0, swipeReset = null;
addEventListener("wheel", e => {
  if (!desktop()) return;
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();
  const now = Date.now();
  if (now - swipeLock < 600) return;
  swipeAccum += e.deltaX;
  clearTimeout(swipeReset);
  swipeReset = setTimeout(() => { swipeAccum = 0; }, 180);
  if (Math.abs(swipeAccum) > 90) {
    swipeLock = now;
    goRoom(cur + (swipeAccum > 0 ? 1 : -1));
    swipeAccum = 0;
  }
}, { passive: false });

// touch swipe (tablets)
let touchX = null;
addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
addEventListener("touchend", e => {
  if (touchX === null || !desktop()) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 70) goRoom(cur + (dx < 0 ? 1 : -1));
  touchX = null;
}, { passive: true });

addEventListener("keydown", e => {
  if (/input|textarea/i.test(document.activeElement?.tagName || "")) return;
  if (e.key === "ArrowRight") goRoom(cur + 1);
  if (e.key === "ArrowLeft") goRoom(cur - 1);
});

addEventListener("resize", () => {
  if (desktop()) track.style.transform = `translateX(${-cur * document.documentElement.clientWidth}px)`;
  else track.style.transform = "";
});

// deep-link on load, without animating there
(function initRoom() {
  const idx = rooms.findIndex(r => "#" + r.id === location.hash);
  if (idx > 0) {
    track.style.transition = "none";
    goRoom(idx);
    requestAnimationFrame(() => requestAnimationFrame(() => { track.style.transition = ""; }));
  } else {
    paintNav();
  }
})();

const roomVisible = id => {
  const r = document.getElementById(id).getBoundingClientRect();
  return r.left < innerWidth && r.right > 0 && r.top < innerHeight && r.bottom > 0;
};

/* ============================================================
   Hero — cursor-reactive dot field + confetti + typewriter
   ============================================================ */
const field = document.getElementById("field");
if (field && !reducedMotion) {
  const ctx = field.getContext("2d");
  let W, H, pts = [];
  const GAP = 46;
  function build() {
    W = field.width = field.offsetWidth * devicePixelRatio;
    H = field.height = field.offsetHeight * devicePixelRatio;
    pts = [];
    const g = GAP * devicePixelRatio;
    for (let y = g / 2; y < H; y += g)
      for (let x = g / 2; x < W; x += g)
        pts.push({ x, y });
  }
  build();
  addEventListener("resize", build);
  let mx = -9999, my = -9999;
  const hero = document.getElementById("hero");
  hero.addEventListener("pointermove", e => {
    const r = field.getBoundingClientRect();
    mx = (e.clientX - r.left) * devicePixelRatio;
    my = (e.clientY - r.top) * devicePixelRatio;
  });
  hero.addEventListener("pointerleave", () => { mx = my = -9999; });
  let t = 0;
  (function draw() {
    t += 0.015;
    ctx.clearRect(0, 0, W, H);
    const R = 150 * devicePixelRatio;
    for (const p of pts) {
      const dx = p.x - mx, dy = p.y - my;
      const d = Math.hypot(dx, dy);
      let x = p.x + Math.sin(t + p.y * 0.01) * 2 * devicePixelRatio;
      let y = p.y + Math.cos(t + p.x * 0.01) * 2 * devicePixelRatio;
      let size = 1.6, alpha = 0.16, color = "34,28,20";
      if (d < R) {
        const k = 1 - d / R;
        x += (dx / (d || 1)) * k * 26 * devicePixelRatio;
        y += (dy / (d || 1)) * k * 26 * devicePixelRatio;
        size = 1.6 + k * 2.6;
        alpha = 0.16 + k * 0.5;
        color = "230,57,47";
      }
      ctx.fillStyle = `rgba(${color},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
}

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
document.getElementById("hero-name").addEventListener("click", e => confettiBurst(e.clientX, e.clientY));

const roles = ["a chess site with real users", "agents that cite their evidence", "scalable Go backends", "native iOS apps", "bare-metal firmware"];
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

/* ============================================================
   Counters
   ============================================================ */
function animateCount(el) {
  const target = +el.dataset.count;
  const t0 = performance.now();
  function step(t) {
    const k = Math.min((t - t0) / 1400, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString();
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const countObserver = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { animateCount(e.target); countObserver.unobserve(e.target); }
}, { threshold: 0.5 });
document.querySelectorAll("[data-count]").forEach(el => countObserver.observe(el));

// geoguessr points bar fills alongside the count
const ggFill = document.getElementById("gg-fill");
if (ggFill) {
  const fillObserver = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        ggFill.animate([{ width: "0%" }, { width: "100%" }],
          { duration: reducedMotion ? 1 : 1400, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "forwards" });
        fillObserver.unobserve(e.target);
      }
    }
  }, { threshold: 0.4 });
  fillObserver.observe(ggFill.closest(".gg-result"));
}

/* ============================================================
   Atlas — world map of visited countries
   ============================================================ */
const VISITED = ["nz", "au", "sg", "cn", "hk", "tw", "jp", "th", "fr", "it", "gb", "mc", "va", "bg", "cz", "nl", "ch", "us", "ca", "sa", "qa", "ae"];
const mapBox = document.getElementById("worldmap");
if (mapBox) {
  fetch("world.svg")
    .then(r => r.text())
    .then(txt => {
      mapBox.innerHTML = txt;
      const svg = mapBox.querySelector("svg");
      const NS = "http://www.w3.org/2000/svg";
      const overlay = document.createElementNS(NS, "g");

      const center = id => {
        const p = svg.getElementById(id);
        if (!p) return null;
        const b = p.getBBox();
        return [b.x + b.width / 2, b.y + b.height / 2, b];
      };

      for (const id of VISITED) {
        const p = svg.getElementById(id);
        if (!p) continue;
        p.classList.add("visited");
        const [cx, cy, b] = center(id);
        if (b.width < 8 && b.height < 8) {
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("cx", cx); c.setAttribute("cy", cy);
          c.setAttribute("r", 3.5);
          c.setAttribute("class", "micro-pin");
          overlay.appendChild(c);
        }
      }

      // Auckland → Houston arc, calibrated from two known countries
      const cu = center("cu"), qa = center("qa"), nz = center("nz");
      if (cu && qa && nz) {
        const ax = (qa[0] - cu[0]) / (51.2 - (-79.4));
        const bx = cu[0] - ax * (-79.4);
        const ay = (nz[1] - cu[1]) / (-41.2 - 21.5);
        const by = cu[1] - ay * 21.5;
        const pt = (lon, lat) => [ax * lon + bx, ay * lat + by];
        const [x1, y1] = pt(174.8, -36.9);   // Auckland
        const [x2, y2] = pt(-95.4, 29.8);    // Houston
        const arc = document.createElementNS(NS, "path");
        arc.setAttribute("d", `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 130} ${x2} ${y2}`);
        arc.setAttribute("class", "arc-line");
        overlay.appendChild(arc);
        for (const [x, y] of [[x1, y1], [x2, y2]]) {
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("cx", x); c.setAttribute("cy", y);
          c.setAttribute("r", 4.5);
          c.setAttribute("class", "arc-dot");
          overlay.appendChild(c);
        }
      }
      svg.appendChild(overlay);

      // tooltip — country names from ISO codes via the browser
      const tip = document.getElementById("map-tip");
      const card = mapBox.closest(".gg-mini");
      let regionNames = null;
      try { regionNames = new Intl.DisplayNames(["en"], { type: "region" }); } catch { /* fallback below */ }
      svg.addEventListener("pointermove", e => {
        const t = e.target.closest("path");
        if (!t) { tip.classList.remove("show"); return; }
        const code = t.id.toUpperCase();
        let name = code;
        if (regionNames) { try { name = regionNames.of(code) || code; } catch { name = code; } }
        tip.innerHTML = (t.classList.contains("visited") ? '<span class="tick">✓</span> ' : "") + name;
        const r = card.getBoundingClientRect();
        tip.style.left = e.clientX - r.left + 14 + "px";
        tip.style.top = e.clientY - r.top - 10 + "px";
        tip.classList.add("show");
      });
      svg.addEventListener("pointerleave", () => tip.classList.remove("show"));
    })
    .catch(() => { mapBox.innerHTML = '<p class="mono">map failed to load</p>'; });
}

/* ============================================================
   Chess — playable board, every white piece is a skill
   ============================================================ */
const GLYPH = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 99 };
const KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const PIECE_LINES = {
  k: "if this falls, the game is over.",
  q: "goes everywhere, does everything.",
  r: "straight lines, heavy lifting.",
  b: "works the long diagonals.",
  n: "moves in ways nothing else can.",
  p: "small, forward-only, promotes.",
};
const PIECE_NAMES = { k: "King", q: "Queen", r: "Rook", b: "Bishop", n: "Knight", p: "Pawn" };

let board, whiteTurn, rights, gameOver, lastMove, sel, targets, caps;

function newGame() {
  const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
  const backSkills = ["C/C++", "Swift · SwiftUI", "PyTorch", "Python", "Git", "React", "Terraform", "Go"];
  const pawnSkills = ["Docker", "PostgreSQL", "Redis", "FastAPI", "WebSockets", "AWS · ECS/SQS", "GitHub Actions", "TypeScript"];
  board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { t: back[c], w: false };
    board[1][c] = { t: "p", w: false };
    board[6][c] = { t: "p", w: true, skill: pawnSkills[c] };
    board[7][c] = { t: back[c], w: true, skill: backSkills[c] };
  }
  whiteTurn = true;
  rights = { w: { k: true, q: true }, b: { k: true, q: true } };
  gameOver = false;
  lastMove = null; sel = null; targets = [];
  caps = { w: [], b: [] };
}
const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

function isAttacked(B, r, c, byWhite) {
  const pr = byWhite ? r + 1 : r - 1;
  for (const dc of [-1, 1]) {
    if (inB(pr, c + dc)) {
      const p = B[pr][c + dc];
      if (p && p.w === byWhite && p.t === "p") return true;
    }
  }
  for (const [dr, dc] of KN) {
    const r2 = r + dr, c2 = c + dc;
    if (inB(r2, c2)) {
      const p = B[r2][c2];
      if (p && p.w === byWhite && p.t === "n") return true;
    }
  }
  for (const dirs of [DIAG, ORTH]) {
    const sliders = dirs === DIAG ? ["b", "q"] : ["r", "q"];
    for (const [dr, dc] of dirs) {
      let r2 = r + dr, c2 = c + dc, dist = 1;
      while (inB(r2, c2)) {
        const p = B[r2][c2];
        if (p) {
          if (p.w === byWhite && (sliders.includes(p.t) || (p.t === "k" && dist === 1))) return true;
          break;
        }
        r2 += dr; c2 += dc; dist++;
      }
    }
  }
  return false;
}

function pseudo(B, r, c, rt) {
  const p = B[r][c], out = [];
  const slide = dirs => {
    for (const [dr, dc] of dirs) {
      let r2 = r + dr, c2 = c + dc;
      while (inB(r2, c2)) {
        const q = B[r2][c2];
        if (!q) out.push([r2, c2]);
        else { if (q.w !== p.w) out.push([r2, c2]); break; }
        r2 += dr; c2 += dc;
      }
    }
  };
  if (p.t === "p") {
    const d = p.w ? -1 : 1, start = p.w ? 6 : 1;
    if (inB(r + d, c) && !B[r + d][c]) {
      out.push([r + d, c]);
      if (r === start && !B[r + 2 * d][c]) out.push([r + 2 * d, c]);
    }
    for (const dc of [-1, 1]) {
      const r2 = r + d, c2 = c + dc;
      if (inB(r2, c2) && B[r2][c2] && B[r2][c2].w !== p.w) out.push([r2, c2]);
    }
  } else if (p.t === "n") {
    for (const [dr, dc] of KN) {
      const r2 = r + dr, c2 = c + dc;
      if (inB(r2, c2) && (!B[r2][c2] || B[r2][c2].w !== p.w)) out.push([r2, c2]);
    }
  } else if (p.t === "k") {
    for (const [dr, dc] of [...DIAG, ...ORTH]) {
      const r2 = r + dr, c2 = c + dc;
      if (inB(r2, c2) && (!B[r2][c2] || B[r2][c2].w !== p.w)) out.push([r2, c2]);
    }
    const rank = p.w ? 7 : 0, side = p.w ? rt.w : rt.b;
    if (r === rank && c === 4 && !isAttacked(B, rank, 4, !p.w)) {
      if (side.k && !B[rank][5] && !B[rank][6] &&
          B[rank][7]?.t === "r" && B[rank][7].w === p.w &&
          !isAttacked(B, rank, 5, !p.w) && !isAttacked(B, rank, 6, !p.w)) out.push([rank, 6]);
      if (side.q && !B[rank][3] && !B[rank][2] && !B[rank][1] &&
          B[rank][0]?.t === "r" && B[rank][0].w === p.w &&
          !isAttacked(B, rank, 3, !p.w) && !isAttacked(B, rank, 2, !p.w)) out.push([rank, 2]);
    }
  } else {
    slide(p.t === "b" ? DIAG : p.t === "r" ? ORTH : [...DIAG, ...ORTH]);
  }
  return out;
}

const cloneB = B => B.map(row => row.map(p => (p ? { ...p } : null)));

function applyMove(B, from, to) {
  const p = B[from[0]][from[1]];
  B[to[0]][to[1]] = p;
  B[from[0]][from[1]] = null;
  if (p.t === "k" && Math.abs(to[1] - from[1]) === 2) {
    const rank = from[0];
    if (to[1] === 6) { B[rank][5] = B[rank][7]; B[rank][7] = null; }
    else { B[rank][3] = B[rank][0]; B[rank][0] = null; }
  }
  if (p.t === "p" && (to[0] === 0 || to[0] === 7)) p.t = "q";
}

function legalFrom(B, r, c, rt) {
  const p = B[r][c], out = [];
  for (const m of pseudo(B, r, c, rt)) {
    const B2 = cloneB(B);
    applyMove(B2, [r, c], m);
    let kr, kc;
    outer: for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++)
        if (B2[i][j]?.t === "k" && B2[i][j].w === p.w) { kr = i; kc = j; break outer; }
    if (!isAttacked(B2, kr, kc, !p.w)) out.push(m);
  }
  return out;
}

function allLegal(B, white, rt) {
  const out = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (B[r][c] && B[r][c].w === white)
        for (const m of legalFrom(B, r, c, rt)) out.push({ from: [r, c], to: m });
  return out;
}

function inCheck(B, white) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (B[r][c]?.t === "k" && B[r][c].w === white)
        return isAttacked(B, r, c, !white);
  return false;
}

// --- chess UI ---
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("chess-status");
const dosPiece = document.getElementById("dossier-piece");
const dosName = document.getElementById("dossier-name");
const dosLine = document.getElementById("dossier-line");
const capsEl = document.getElementById("captures");
const sqEls = [];
if (boardEl) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const d = document.createElement("div");
      d.className = "sq " + ((r + c) % 2 ? "dark" : "light");
      d.addEventListener("click", () => onSquare(r, c));
      boardEl.appendChild(d);
      sqEls.push(d);
    }
  }
  newGame();
  render();
  document.getElementById("chess-reset").addEventListener("click", () => {
    newGame(); render(); setStatus("your move");
    dosPiece.textContent = "♟"; dosName.textContent = "Pick a piece";
    dosLine.textContent = "every piece on your side is a skill";
  });
}

function setStatus(s) { statusEl.textContent = s; }

function render() {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const el = sqEls[r * 8 + c], p = board[r][c];
      el.innerHTML = p ? `<span class="${p.w ? "pc-w" : "pc-b"}">${GLYPH[p.t]}</span>` : "";
      el.classList.toggle("sel", !!sel && sel[0] === r && sel[1] === c);
      const isTgt = targets.some(t => t[0] === r && t[1] === c);
      el.classList.toggle("tgt", isTgt);
      el.classList.toggle("cap", isTgt && !!p);
      el.classList.toggle("last", !!lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c)));
    }
  }
  capsEl.textContent = caps.w.map(t => GLYPH[t]).join(" ");
}

function updateRights(from, to) {
  const p = board[to[0]][to[1]];
  if (p.t === "k") rights[p.w ? "w" : "b"] = { k: false, q: false };
  const corners = [[7, 0, "w", "q"], [7, 7, "w", "k"], [0, 0, "b", "q"], [0, 7, "b", "k"]];
  for (const [r, c, side, wing] of corners) {
    if ((from[0] === r && from[1] === c) || (to[0] === r && to[1] === c)) rights[side][wing] = false;
  }
}

function afterMove() {
  const oppWhite = whiteTurn;
  const moves = allLegal(board, oppWhite, rights);
  if (moves.length === 0) {
    gameOver = true;
    if (inCheck(board, oppWhite)) setStatus(oppWhite ? "checkmate — rematch?" : "checkmate — gg");
    else setStatus("stalemate");
    return;
  }
  if (inCheck(board, oppWhite)) setStatus("check!");
  else setStatus(oppWhite ? "your move" : "thinking…");
}

function doMove(from, to) {
  const victim = board[to[0]][to[1]];
  if (victim) caps[victim.w ? "b" : "w"].push(victim.t);
  applyMove(board, from, to);
  updateRights(from, to);
  lastMove = { from, to };
  whiteTurn = !whiteTurn;
  afterMove();
}

function onSquare(r, c) {
  if (gameOver || !whiteTurn) return;
  const p = board[r][c];
  if (sel && targets.some(t => t[0] === r && t[1] === c)) {
    doMove(sel, [r, c]);
    sel = null; targets = [];
    render();
    if (!gameOver) setTimeout(botMove, 420 + Math.random() * 300);
    return;
  }
  if (p && p.w) {
    sel = [r, c];
    targets = legalFrom(board, r, c, rights);
    dosPiece.innerHTML = `<span class="pc-b">${GLYPH[p.t]}</span>`;
    dosName.textContent = p.skill || PIECE_NAMES[p.t];
    dosLine.textContent = PIECE_LINES[p.t] + (p.skill && p.t === "q" && p.skill !== "Python" ? " (promoted.)" : "");
  } else {
    sel = null; targets = [];
  }
  render();
}

function botMove() {
  if (gameOver) return;
  const moves = allLegal(board, false, rights);
  if (!moves.length) return;
  let best = null, bestScore = -1;
  for (const m of moves) {
    const victim = board[m.to[0]][m.to[1]];
    const score = (victim ? VAL[victim.t] * 10 : 0) + Math.random() * 4;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  doMove(best.from, best.to);
  render();
}

/* ============================================================
   Ski room — snow
   ============================================================ */
const snowBox = document.querySelector(".snow");
if (snowBox && !reducedMotion) {
  const glyphs = ["❄", "❅", "•"];
  for (let i = 0; i < 30; i++) {
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

/* ============================================================
   Tilt cards
   ============================================================ */
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

/* ============================================================
   Deck — deploys
   ============================================================ */
const arena = document.getElementById("deck");
const deployLine = document.getElementById("deploy-line");
const TETRA_COLORS = ["#00f0f0", "#f0f000", "#a000f0", "#00f000", "#f00000", "#0000f0", "#f0a000"];
let deployTimer = null;
document.querySelectorAll(".cr-card").forEach(card => {
  card.addEventListener("click", () => {
    deployLine.textContent = card.dataset.cry;
    clearTimeout(deployTimer);
    deployTimer = setTimeout(() => { deployLine.innerHTML = "&nbsp;"; }, 2400);
    if (reducedMotion) return;
    if (card.dataset.deploy === "tetris") {
      for (let i = 0; i < 16; i++) {
        const b = document.createElement("div");
        b.className = "tetromino";
        const s = 16 + Math.random() * 18;
        b.style.width = b.style.height = s + "px";
        b.style.left = Math.random() * 96 + "%";
        b.style.background = TETRA_COLORS[i % TETRA_COLORS.length];
        arena.appendChild(b);
        const anim = b.animate([
          { transform: "translateY(0) rotate(0)" },
          { transform: `translateY(${arena.offsetHeight + 120}px) rotate(${(Math.random() - 0.5) * 720}deg)` },
        ], { duration: 1400 + Math.random() * 1400, easing: "cubic-bezier(0.4, 0, 0.9, 0.6)", delay: Math.random() * 500 });
        anim.onfinish = () => b.remove();
      }
      return;
    }
    const runner = document.createElement("span");
    runner.className = "runner";
    runner.textContent = card.dataset.deploy;
    arena.appendChild(runner);
    const dist = arena.offsetWidth + 160;
    const anim = runner.animate([
      { transform: "translateX(0) scaleX(-1)" },
      { transform: `translateX(${dist * 0.5}px) translateY(-30px) scaleX(-1)`, offset: 0.5 },
      { transform: `translateX(${dist}px) scaleX(-1)` },
    ], { duration: 1700, easing: "linear" });
    anim.onfinish = () => runner.remove();
  });
});


/* ============================================================
   Drums (WebAudio) + Minecraft hotbar
   ============================================================ */
let audioCtx = null;
function actx() {
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
  drums[name](actx());
  btn.classList.add("hit");
  setTimeout(() => btn.classList.remove("hit"), 90);
}
document.querySelectorAll(".drum").forEach(btn => {
  btn.addEventListener("pointerdown", () => hitDrum(btn.dataset.drum));
});

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
  if (!roomVisible("contact")) return;
  const name = drumKeys[e.key.toLowerCase()];
  if (name) hitDrum(name);
  const digit = +e.key;
  if (digit >= 1 && digit <= slots.length) selectSlot(digit - 1);
});

/* ------------------------------------------------------------
   Record wall parallax
   The sleeves lean away from the pointer. Depth is per-sleeve, so
   the wall separates instead of sliding as one sheet. Written to a
   custom property and read back in the transform, which keeps the
   drift keyframe and the parallax from overwriting each other.
   ------------------------------------------------------------ */
(() => {
  const wall = document.querySelector(".lp-wall");
  if (!wall || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const room = wall.closest("section") || wall.parentElement;
  let frame = null;
  room.addEventListener("pointermove", (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const r = room.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      wall.style.setProperty("--px", `${(-dx * 26).toFixed(1)}px`);
      wall.style.setProperty("--py", `${(-dy * 20).toFixed(1)}px`);
    });
  });
  room.addEventListener("pointerleave", () => {
    wall.style.setProperty("--px", "0px");
    wall.style.setProperty("--py", "0px");
  });
})();

/* ------------------------------------------------------------
   Terminal room
   Room names navigate, project names open, and anything else is
   looked up in a written knowledge base. It is a lookup, not a model,
   so when nothing matches it says it does not know rather than
   inventing an answer.
   ------------------------------------------------------------ */
(() => {
  const term = document.getElementById("term");
  if (!term) return;
  const out = document.getElementById("term-out");
  const input = document.getElementById("term-in");
  const body = document.getElementById("term-body");

  const ROOMS = ["hero", "origin", "fencing", "chess", "work", "projects", "terminal", "contact"];
  const LINKS = {
    blundernet: ["https://blundernet.com", "the chess site"],
    vestigo: ["https://vestigo.earth", "the geolocation agent"],
    github: ["https://github.com/leozh0u", "the code"],
    linkedin: ["https://linkedin.com/in/leozhou8", "the professional one"],
  };

  // Everything the prompt knows. Keys are what someone might type; the
  // answers are Leo's own, kept to what is already public on the site,
  // the resume or the repos.
  const KB = [
    [["who", "about", "yourself", "bio", "introduce"],
     "Leo Zhou. CS at Rice, from Auckland, New Zealand.\nBackend and infrastructure mostly, in Go and Python. I fence, I drum, and I run a chess site."],
    [["rice", "study", "school", "university", "major", "degree", "gpa", "course"],
     "Computer Science at Rice, GPA 3.92. Coursework so far is data structures and algorithms, systems programming, discrete maths and linear algebra."],
    [["switch", "ece", "electrical", "why cs"],
     "I started in electrical and computer engineering and switched to CS. The embedded work on this site is left over from that, and I do not regret the detour: writing firmware against a reference manual taught me to check things rather than assume them."],
    [["blundernet", "chess site", "puzzles"],
     "blundernet.com, a free chess training site I built and run, around 120 users.\n3.25 million puzzles you can filter by rating, theme, opening, phase and solution length all at once, which no other site lets you do. There is a classroom mode where a coach pushes a position to a team and sees the answers grouped by move. Every position is written out for a screen reader.\nReact over stateless Go on ECS Fargate, Postgres, Redis, engine inference on SQS-autoscaled workers, all Terraform."],
    [["sampler", "random", "slow", "postgres", "optimi"],
     "The one I like. Drawing a random puzzle matching a filter took 1.4 seconds with ORDER BY random(), because it sorts the whole matching set to take one row. I gave every puzzle a stored shuffle key computed once at import and precomputed the filter grid into a summary table with counts. A search now draws a cell in proportion to its size and range scans from a random cursor. 0.9 milliseconds."],
    [["engine", "neural", "alphazero", "mcts"],
     "I trained the engine myself. An AlphaZero-style network guiding Monte-Carlo tree search with a C++ core, trained on games from the top-50 Lichess blitz players, retraining itself on a schedule with no human in the loop. It plays around 1000 Elo, which is bad at chess and about right for a network that size."],
    [["review", "blunder", "brilliant", "centipawn"],
     "Post-game review judges every move by how much it changed your chances of winning rather than by centipawns, because +9 to +6 is three hundred centipawns and means nothing while +0.2 to -0.8 is a hundred and is the whole game. Eight verdicts, brilliant down to blunder. It reads a game pasted from any site."],
    [["vestigo", "geolocation", "photo"],
     "vestigo.earth. An agent that works out where a photograph was taken, at the most specific level the evidence supports, and stops there. Every claim cites the tool result that produced it, so a claim about a street cannot rest on evidence that only reaches a country.\nThe part I care about is calibration. I trained a classifier on 65,300 street-level images with frozen CLIP and geocells clustered on the sphere, held out by location so near-duplicates cannot inflate the number, and its confidence tracks observed accuracy to within about three points."],
    [["research", "xing", "lab", "ai infra"],
     "I am an undergraduate research assistant with Professor Jiarong Xing at Rice, on AI infrastructure. So far: ended a forced daily re-login in a macOS usage-tracking app with OAuth token refresh in Swift, wrote a Keychain credential inspector once the documented token shape turned out to be incomplete, and surfaced usage from sessions run over SSH by discovering the hosts and mirroring their transcripts. Reading into LLM routing next."],
    [["cansemi", "wafer", "semiconductor", "intern"],
     "Software engineer intern at CanSemi over summer 2026. An event-driven Python parser over 500+ binary test equipment logs, a normalised Postgres schema loading 40 wafer lots in under two minutes, a FastAPI service on top, and a React wafer map that cut reporting time by about 75%."],
    [["inkstone", "abc reads", "ios", "swift", "reading"],
     "ABC Reads at Inkstone Technologies, spring and summer 2026. A native iOS reading app in Swift and SwiftUI that adapts to the words you already know. Apple Vision OCR over a live camera overlays pronunciation only on words you have not learned, backed by a 113,000-entry dictionary frequency-ranked into SQLite."],
    [["wind", "turbine", "embedded", "esp32", "firmware"],
     "Rice Wind Energy, embedded software. ESP32 firmware in C reading turbine speed, power output and blade pitch, a six-state safety machine with fault latching, and perturb-and-observe power tracking."],
    [["fencing", "fence", "sabre", "epee", "foil"],
     "The thing I have put the most into. I competed internationally for New Zealand at cadet, junior and senior level, including World Championships, World Cups and the Commonwealth Games. Roughly 30 to 40 titles across New Zealand and Oceania. I captained the junior and cadet national teams at the same time and led the team to an Oceania title."],
    [["drum", "music", "band", "rock", "jazz"],
     "I play the drums, mostly rock with some jazz. I made it to Grade 8 with a High Distinction and a Rockschool award. I have played since I was a kid, in many different groups and plays, and it is still the thing I will always do occasionally."],
    [["piano"], "Played for a while. Competent, not great."],
    [["hobby", "hobbies", "interest", "fun", "free time", "outside"],
     "Fencing, drums, chess, and skiing. Minecraft and Supercell games, Tetris, basketball, tennis, ping pong, and drawing. Jack of all trades, master of one or two."],
    [["education", "care", "why", "nonprofit", "charity", "pathfinders", "teaching"],
     "I think education is the best way to solve problems like poverty and crime, because children are malleable and a good educator early on decides what somebody ends up caring about. I was lucky with mine.\nWhen I was young I went to a maths programme run by a nonprofit, and one teacher there made maths interesting in a way school never had. It was free, and somebody had decided to run it. That is most of the reason I ended up in STEM at all.\nBefore Rice I ran Physics Pathfinders, a charity taking hands-on physics into schools without much funding, reaching 600+ students across 22 schools."],
    [["new zealand", "nz", "auckland", "home", "from", "kiwi"],
     "Auckland, New Zealand. My school there had a week of camping in the curriculum every year, which I assumed was normal until I came to Rice."],
    [["backend", "lane", "want to work", "looking for", "interested in", "goal"],
     "Backend, cloud and distributed systems. That is where my strongest evidence is and what I want to keep doing. ML and embedded are real but they are one project and one club role each, so I do not lead with them."],
    [["stack", "tech", "language", "tools", "know"],
     "Go, Python, Swift, C and C++, JavaScript and React.\nPostgres, Redis, SQS, ONNX, Docker, Terraform, AWS."],
    [["contact", "email", "hire", "reach", "talk", "message"],
     "zhouleo2007@gmail.com. Or type contact to go to the room with every link on it."],
  ];

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const print = (html = "") => {
    const d = document.createElement("div");
    d.innerHTML = html;
    out.appendChild(d);
    body.scrollTop = 1e6;
  };
  const say = (text) => text.split("\n").forEach(l => print(esc(l)));

  const hist = [];
  let histAt = 0;

  const CMDS = {
    help() {
      print('<span class="t-dim">rooms   </span>' + ROOMS.map(r => `<span class="t-key">${r}</span>`).join(" "));
      print('<span class="t-dim">open    </span>' + Object.keys(LINKS).map(k => `<span class="t-key">${k}</span>`).join(" "));
      print('<span class="t-dim">also    </span><span class="t-key">whoami</span> <span class="t-key">stack</span> <span class="t-key">resume</span> <span class="t-key">topics</span> <span class="t-key">clear</span>');
      print('<span class="t-dim">or just ask: "what is blundernet", "do you fence", "what do you want to work on"</span>');
    },
    topics() {
      print('<span class="t-dim">it knows about:</span>');
      print(KB.map(k => `<span class="t-key">${k[0][0]}</span>`).join("  "));
    },
    whoami() { say(KB[0][1]); },
    stack() { say(KB.find(k => k[0][0] === "stack")[1]); },
    resume() {
      print('<span class="t-ok">downloading</span> LeoZhou_resume.pdf');
      const a = document.createElement("a");
      a.href = "LeoZhou_resume.pdf"; a.download = "";
      document.body.appendChild(a); a.click(); a.remove();
    },
    ls() { print(ROOMS.map(r => `<span class="t-key">${r}</span>`).join("  ")); },
    clear() { out.innerHTML = ""; },
    sudo() { print('<span class="t-dim">leo is not in the sudoers file. This incident will be reported.</span>'); },
  };

  function lookup(q) {
    const t = q.toLowerCase();
    let best = null, bestScore = 0;
    for (const [keys, answer] of KB) {
      for (const k of keys) {
        if (t.includes(k) && k.length > bestScore) { best = answer; bestScore = k.length; }
      }
    }
    return best;
  }

  function run(raw) {
    const line = raw.trim();
    print(`<span class="t-echo"><span class="term-prompt">leo@portfolio ~ %</span> ${esc(line)}</span>`);
    if (!line) return;
    hist.push(line); histAt = hist.length;

    const lower = line.toLowerCase();
    if (/\bclaude\b/.test(lower)) return jumpscare();

    const [head, ...rest] = lower.split(/\s+/);
    if ((head === "cd" || head === "go" || head === "open") && rest[0]) {
      if (ROOMS.includes(rest[0])) return goto(rest[0]);
      if (LINKS[rest[0]]) return follow(rest[0]);
    }
    if (ROOMS.includes(head) && rest.length === 0) return goto(head);
    if (LINKS[head] && rest.length === 0) return follow(head);
    if (CMDS[head] && rest.length === 0) return CMDS[head]();

    const hit = lookup(line);
    if (hit) return say(hit);
    print('<span class="t-dim">I don\'t know.</span>');
    print('<span class="t-dim">Try </span><span class="t-key">topics</span><span class="t-dim"> for what it does know, or </span><span class="t-key">help</span><span class="t-dim"> for commands.</span>');
  }

  function goto(room) {
    print(`<span class="t-ok">→</span> ${room}`);
    setTimeout(() => goRoom(ROOMS.indexOf(room)), 240);
  }
  function follow(key) {
    const [url, note] = LINKS[key];
    print(`<span class="t-ok">opening</span> <a href="${url}" target="_blank" rel="noopener">${url}</a> <span class="t-dim">${note}</span>`);
    window.open(url, "_blank", "noopener");
  }

  /* The one joke in here. Reduced motion gets the punchline without the shock. */
  function jumpscare() {
    if (reducedMotion) {
      print('<span class="t-dim">(a jumpscare would go here, but you asked for less motion)</span>');
      return;
    }
    const veil = document.createElement("div");
    veil.className = "jumpscare";
    veil.innerHTML = '<span>&gt;_</span>';
    document.body.appendChild(veil);
    document.body.classList.add("jumpshake");
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(880, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.45);
      g.gain.setValueAtTime(0.16, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5);
      o.connect(g).connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.5);
    } catch (e) { /* no audio, still get the flash */ }
    setTimeout(() => {
      veil.remove();
      document.body.classList.remove("jumpshake");
      print('<span class="t-dim">sorry. he helped with the CSS.</span>');
    }, 620);
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const v = input.value; input.value = ""; run(v); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const v = input.value.trim().toLowerCase();
      if (!v) return;
      const pool = [...ROOMS, ...Object.keys(LINKS), ...Object.keys(CMDS)];
      const hits = pool.filter(c => c.startsWith(v));
      if (hits.length === 1) input.value = hits[0];
      else if (hits.length > 1) print(hits.map(h => `<span class="t-key">${h}</span>`).join("  "));
    }
    else if (e.key === "ArrowUp")   { if (histAt > 0) { input.value = hist[--histAt] || ""; } e.preventDefault(); }
    else if (e.key === "ArrowDown") { if (histAt < hist.length) { input.value = hist[++histAt] || ""; } e.preventDefault(); }
  });

  body.addEventListener("click", () => input.focus());

  print('<span class="t-dim">Leo Zhou · portfolio · built from scratch</span>');
  print('<span class="t-dim">Ask a question, or type </span><span class="t-key">help</span><span class="t-dim">.</span>');
  print("");
})();

/* ------------------------------------------------------------
   Work room · the skier
   Scroll position maps to distance along the run, so the skier sits on
   the actual curve rather than sliding down a straight line beside it.
   The tracks are the same path, revealed behind them with a dash offset.
   ------------------------------------------------------------ */
(() => {
  const run = document.getElementById("run");
  const skier = document.getElementById("skier");
  const track = document.getElementById("run-track");
  const svg = document.querySelector(".run-svg");
  if (!run || !skier || !track || !svg) return;

  // The page does not scroll on desktop: body is overflow hidden and each
  // .room scrolls itself. So the scroll to follow is the room's, not the
  // window's, and not the run's (which no longer scrolls at all).
  const scroller = run.closest(".room") || document.scrollingElement;

  const len = track.getTotalLength();
  track.style.strokeDasharray = `${len}`;
  track.style.strokeDashoffset = `${len}`;

  // Path y is monotonic down the run, so the point level with a given height
  // can be found by bisection. Cheaper and steadier than walking the length.
  function atHeight(yTarget) {
    let lo = 0, hi = len;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (track.getPointAtLength(mid).y < yTarget) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  let frame = null;
  function place() {
    frame = null;
    const box = svg.getBoundingClientRect();
    if (!box.width) return;                       // room not laid out yet

    const sx = box.width / 600, sy = box.height / 1576;
    const runBox = run.getBoundingClientRect();
    const sBox = scroller.getBoundingClientRect();
    const originX = (run.clientWidth - box.width) / 2;
    const originY = box.top - runBox.top;

    // Hold the eye line inside whatever is scrolling, and clamp so the skier
    // parks at either end of the path once the run has gone by.
    const eye = sBox.top + scroller.clientHeight * 0.45;
    const contentY = Math.min(Math.max(eye - runBox.top, 0), runBox.height);

    const at = atHeight((contentY - originY) / sy);
    const pt = track.getPointAtLength(at);
    const ahead = track.getPointAtLength(Math.min(len, at + 14));
    const angle = Math.atan2((ahead.y - pt.y) * sy, (ahead.x - pt.x) * sx) * 180 / Math.PI;

    skier.style.transform =
      `translate3d(${originX + pt.x * sx - 18}px, ${contentY - 18}px, 0) rotate(${angle - 90}deg)`;
    track.style.strokeDashoffset = `${len * (1 - at / len)}`;
  }

  const onScroll = () => { if (!frame) frame = requestAnimationFrame(place); };
  scroller.addEventListener("scroll", onScroll, { passive: true });
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  place();
})();
