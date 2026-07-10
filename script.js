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

function paintNav() {
  dots.forEach((d, j) => d.classList.toggle("active", j === cur));
  const id = rooms[cur].id;
  navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
  progressBar.style.width = (cur / (rooms.length - 1)) * 100 + "%";
  edgeL.classList.toggle("off", cur === 0);
  edgeR.classList.toggle("off", cur === rooms.length - 1);
}

function goRoom(i) {
  i = Math.max(0, Math.min(rooms.length - 1, i));
  cur = i;
  if (desktop()) {
    track.style.transform = `translateX(${-i * 100}vw)`;
  } else {
    rooms[i].scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }
  history.replaceState(null, "", "#" + rooms[i].id);
  paintNav();
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
  if (desktop()) track.style.transform = `translateX(${-cur * 100}vw)`;
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

const roles = ["real-time backends", "71 KB neural nets", "bare-metal firmware", "iOS apps"];
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
      const card = mapBox.closest(".atlas-card");
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
  const backSkills = ["C/C++", "STM32 · FreeRTOS", "PyTorch", "Python", "Git", "React", "Swift · SwiftUI", "TypeScript"];
  const pawnSkills = ["Docker", "PostgreSQL", "Redis", "FastAPI", "WebSockets", "SQL", "CI/CD", "Sentry"];
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
   Scoreboard easter egg
   ============================================================ */
const scoreLeft = document.getElementById("score-left");
if (scoreLeft) {
  const sb = scoreLeft.closest(".scoreboard");
  sb.addEventListener("click", e => {
    scoreLeft.textContent = "15";
    sb.querySelector(".score-time").textContent = "TOUCHÉ";
    const lamp = sb.querySelector(".lamp-red");
    lamp.style.animation = "none";
    lamp.style.opacity = "1";
    confettiBurst(e.clientX, e.clientY, 40);
  }, { once: true });
}

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
