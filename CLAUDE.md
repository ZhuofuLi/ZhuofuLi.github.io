# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal academic portfolio for Zhuofu (Chester) Li, a UW Astrophysics/Astrobiology PhD candidate, served at https://zhuofuli.github.io via GitHub Pages.

It is a single-page static site — no framework, no build system, no dependencies, no tests. Hand-written HTML, one CSS file, and two native ES-module JS files.

## Preview & deployment

- **Preview locally:** serve the repo root, e.g. `python3 -m http.server 8000`, then open http://localhost:8000. A server (not opening files via `file://`) is required because the page loads ES modules, which browsers only run over http(s).
- **Deploy:** GitHub Pages publishes automatically from the default branch (`main`) on push. There is no build step — committed files are served as-is.

## Architecture

The entire site is **`index.html`** — one scrolling page whose `<section>`s (`#about`, `#research`, `#skills`, `#education`, `#gallery`, `#contact`) are the targets of the anchor nav. `about.html` and `contact.html` are now one-line meta-refresh **redirect stubs** to `/#about` and `/#contact`, kept only so old inbound links still resolve.

- **`assets/css/styles.css`** — one organized stylesheet. Design decisions live in the `:root` custom properties (color, type scale, spacing, radii, motion); change tokens there rather than hard-coding values. Glass surfaces use `backdrop-filter` with an `@supports` solid fallback.

- **`assets/js/main.js`** — the entry ES module (`<script type="module">`, so it is deferred and the DOM is ready on run). It wires every interaction: intro overlay, header scroll-state + scroll-spy, mobile nav, scroll-reveal, gallery lightbox, contact email + copy, footer easter egg. Each feature is an isolated IIFE guarded against missing elements, so the same module also runs harmlessly on `404.html`.

- **`assets/js/starfield.js`** — exports `initStarfield()`, which renders the `#starfield` canvas. Self-contained and performance-bound: DPR capped at 2, star count scales with viewport area, animation pauses while the tab is hidden.

- **Motion is gated.** Every animation respects `prefers-reduced-motion` — in CSS (the global reduce block) and in JS (the `reduced` flag). When adding motion, handle both.

- **The intro overlay has three independent escape hatches** so it can never trap a user: `main.js` dismisses it (~1.1 s), a CSS `intro-failsafe` animation hides it at 4 s, and a `<noscript>` rule removes it entirely. Keep all three if you touch the intro.

- **The contact email is assembled in JS** from parts (`zhuofu` + `uw.edu`) to deter scrapers; the HTML ships an obfuscated `zhuofu [at] uw.edu` placeholder that JS upgrades. Don't hard-code the plain address.

- **Fonts** are self-hosted woff2 in `assets/fonts/` (no external font CDN) and preloaded in the `<head>`.

## Images

`tools/optimize-images.py` (Pillow) regenerates everything in `assets/img/` — responsive WebP + JPEG photos, favicons, and the OG image. The committed `assets/img/` outputs are what the site serves; re-running the script requires the original full-resolution photos to be placed back into an `images/` directory (intentionally not kept in the repo). HTML references photos through `<picture>` (WebP + JPEG) with explicit `width`/`height` and `loading="lazy"`.

## Content accuracy

On-page research copy, metrics, and credentials are drawn from `files/CV.pdf`. Keep them consistent with the CV — verify against it before changing factual claims (advisors, dates, and figures such as the 4–4.8 h Trojan spin barrier).
