# leo-portfolio — progress

Running log so a fresh tab can pick this up. Newest first.

## Done, pushed (8 Sept 2026)

- **Work room rebuilt as a run you ski.** Vertical scroll inside the room, gates alternating left and right of a winding piste, and a skier that holds station about 40% down the view, weaves along the path and rotates to its heading while its tracks cut in behind. Replaced the earlier horizontal version, which was not the concept.
- **Fencing scoreboard.** `ZHOU 15 - 14 DOUBT`, built in CSS rather than dropped in as an image so it stays sharp and themeable. Red lamp lit and pulsing, green unlit, since the last touch was his.
- **Fixed a stray `}`** left by an earlier slice edit in `style.css`. It was silently killing every rule after it. If new CSS ever appears to do nothing, check brace balance first: `python3 -c "s=open('style.css').read();print(s.count('{')-s.count('}'))"` should print 0.

- **Resume refreshed.** Site was serving an Aug 26 build missing the research role. Now the Sep 5 general (2028) build. Standing rule: refresh whenever this repo is touched.
- **Work room is a slalom**, not a card grid. Six gates descending left to right down a piste band, red/blue pole pairs, horizontal scroll past the sixth, stacks on mobile. Research entry trimmed to stop the run overflowing.
- **Deck room deleted, terminal room added** (`#terminal`, room 06). Commands + knowledge-base fallback, honest "I don't know", `claude` triggers a jumpscare (skipped under reduced motion). Deck's hobby list was deleted per decision, not moved.
- **Contact room is a collage** of 24 album sleeves, full colour, torn/paper treatments, grain. Words sit on their own bordered panel. Stage lights and drum-kit outline removed. Covers live in `photos/albums/`, see its README.
- **Hero** carries vestigo.earth beside blundernet.
- **Cut copy** that read as performed: the sheep line, "Ten years behind a blade" → "Ten years fencing", the fencing blurb, "You're white, and the bot takes whatever it can. This one is a toy.", "Shipped bricks on the shelf, fresh ones on the workbench.", "Current rotation. Tap a card to deploy."
- **Cache busting.** `style.css` and `script.js` carry `?v=` because GitHub Pages was serving stale assets. **Bump the string whenever either file changes.**

## Gotchas worth keeping

- **Rooms are sized off the track, not `100vw`.** They used to be `flex: 0 0 100vw` while `goRoom` translated by `document.documentElement.clientWidth`. Those two differ by the scrollbar and by sub-pixel rounding under browser zoom, and the error compounded across eight rooms until a neighbour showed at the edge. Both now use the track's own width. If you touch either, keep them on the same measure.
- **`.gates` needs `align-items: start`.** Grid items stretch to their row by default, which made the cards touch no matter what the gap said.

## Verified vs not

**How this site scrolls, which is easy to get wrong.** `body` is `overflow-y: hidden`, so the page never scrolls on desktop. Each `.room` is its own scroller (`#work` measured at scrollHeight 1766 / clientHeight 720). Anything that reacts to scroll must listen to the room, not to `window`. The skier got this wrong twice.

**Not visually verified:** the skier following the run after it was rebound to the room's scroll. The diagnosis was measured while the preview rendered; the fix follows from it and the file parses, but the preview pane went headless (`innerHeight` 0) before it could be watched. **Someone should scroll the work room and confirm the skier tracks the path.**

## Open

- **Scoreboard interaction was lost.** The old fencing scoreboard, removed as a duplicate, had a click easter egg: 14-14 with a running clock, click to score the winning touch, clock flips to TOUCHÉ, red lamp locks on, confetti fires. The new box is static at 15-14. The behaviour could be moved onto it.
- **The rest of the site has not had the pass.** Contact, terminal and work are done. Untouched: hero, origin (GeoGuessr), fencing, chess, projects.
- **Direction not settled.** Asked twice, no answer: does "as abstract as possible" mean (a) keep every room, push the treatment — grain, torn edges, duotone, heavier type, or (b) strip the literal props and let colour, shape and motion carry each room. (b) costs the working chess board and the drum kit.
- **Copy still in the performed register**, flagged and not yet ruled on: the Minecraft hotbar item names in the contact room ("Épée of Smiting", "Debugger Pickaxe", "Gold Medal ×27"), SeatLive's "two people, one seat, one winner", Edge-ML's "55× smaller, still listening", and the workbench quote "I only work in black. And sometimes very, very dark grey."
- **Room numbers above each heading** (`01 · origin`) were kept on purpose: they orient you in the horizontal track. Revisit only if the track goes.
