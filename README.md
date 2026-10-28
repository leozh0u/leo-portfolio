# Leo Zhou, portfolio

Personal portfolio site. Static HTML, CSS and JS, no build step.

Full-stack software and applied AI, with current KEWW/RiceApps work, research,
BlunderNet, Vestigo and a few smaller projects. Perch and Notch Apple join
From Scratch and SeatLive; Notch Apple is credited as an extension of Boring Notch.

https://leozhou.fyi/

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

## Structure

- `index.html`: all content, as 8 full-screen rooms navigated horizontally (hero, origin, fencing, chess, work, projects, terminal, contact); stacks vertically under 900px
- `style.css`: theme and animations
- `script.js`: room navigation (wheel, keys, dots), the cursor-reactive dot field, a playable chess board where each white piece is a skill, the ski run in the work room, the terminal, WebAudio drums and the Minecraft hotbar
- `photos/`: photos and album sleeves
- `world.svg`: the map in the origin room
- `LeoZhou_resume.pdf`: linked from the hero and the contact room
- `photos/projects/`: Perch and Notch Apple app artwork
- `tests/terminal.cjs`: browser regression checks for the terminal at desktop and phone sizes
- `tests/content.cjs`: current work/project copy, app artwork and responsive overflow checks

## Updating projects

Each project is a `.lego-card` in `index.html` under `#projects`. Copy an existing card and pick a color class (`lego-red`, `lego-yellow`, `lego-blue`, or add one in CSS).

Bump the `?v=` string on `style.css` or `script.js` whenever either file changes, since GitHub Pages serves cached copies otherwise.

## Checks

With Playwright installed and Chromium available:

```sh
node --check script.js
node tests/terminal.cjs
node tests/content.cjs
```

Set `PLAYWRIGHT_MODULE` to an installed Playwright module path if it is outside this
checkout. The test opens this static site directly, saves screenshots in ignored
`.local/terminal-check/`, and closes its browser.
