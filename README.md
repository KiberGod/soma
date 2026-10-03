# Soma — website

The landing page for [Soma](https://kibergod.github.io/soma/), a desktop assistant for Windows, macOS and Linux.

Plain HTML/CSS/JS, no build step — served by GitHub Pages from the `main` branch.

- `index.html`, `styles.css` — the page
- `i18n.js` — every text, in English and Russian
- `app.js` — language and OS detection, the download section
- `assets/` — avatar, icons and screenshots (`assets/shots/<lang>/`)

## Downloads

Installers are **not** committed here. They're attached to [GitHub Releases](https://github.com/KiberGod/soma/releases) of this repo, and the page lists them through the GitHub API: the newest release becomes the "Download" button (matched to the visitor's OS by file extension — `.msi`/`.exe`, `.dmg`, `.AppImage`/`.deb`/`.rpm`), and every release shows up under "All versions".
