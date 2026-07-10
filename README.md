# Leo Zhou — Portfolio

Personal portfolio site. Static HTML/CSS/JS — no build step, no dependencies.

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy

Works as-is on GitHub Pages, Netlify, or Vercel — just serve the folder.

## Structure

- `index.html` — all content lives here (sections: origin, fencing, skills, experience, projects, games, contact)
- `style.css` — theme + animations
- `script.js` — sparks canvas, typewriter, scroll reveals, counters, tilt cards
- `LeoZhou_resume.pdf` — linked from the contact section

## Updating projects

Each project is a `.lego-card` in `index.html` under `#projects`. Copy an existing card, pick a color class (`lego-red` / `lego-yellow` / `lego-blue`, or add a new one in CSS), and keep the "Next brick loading…" ghost card last.
