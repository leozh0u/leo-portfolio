# Leo Zhou — Portfolio

Personal portfolio site. Static HTML/CSS/JS.

https://leozh0u.github.io/leo-portfolio/

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080
```
## Structure

- `index.html` — all content, as 8 full-screen "rooms" navigated horizontally (hero, origin, fencing, chess, work, projects, deck, contact); stacks vertically under 900px
- `style.css` — theme + animations
- `script.js` — room navigation (wheel/keys/dots), cursor-reactive dot field, a full playable chess engine (each white piece is a skill), Clash Royale deck deploys, WebAudio drums, Minecraft hotbar
- `LeoZhou_resume.pdf` — linked from the contact section

## Updating projects

Each project is a `.lego-card` in `index.html` under `#projects`. Copy an existing card, pick a color class (`lego-red` / `lego-yellow` / `lego-blue`, or add a new one in CSS), and keep the "Next brick loading…" ghost card last.
