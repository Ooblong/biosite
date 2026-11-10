# Iteration log

Every site went through three review passes in a real browser (Chrome via Playwright) at phone (390×844) and desktop (1440×900) sizes. This is what each pass found and what changed.

## Pass 1: build check and first visual review

Automated: console errors, sideways scrolling, missing content, tap-target sizes, and a real submit of the download form.

- **06 Holo Cards**: page crashed. A variable named `top` clashed with the browser's built-in `window.top`. Renamed.
- **02 Darkroom**: desktop scrolled sideways (a rule line poked out past the edge). Fixed.
- **07 Desk OS**: window close buttons were 30×26px, too small to tap. Enlarged. On phones the product window covered the whole screen and hid everything else. Windows now stack below each other and scroll inside, with "Get it free" moved above the preview.
- **08 Terminal**: the ASCII-art logo rendered garbled in the pixel font. Replaced with a plain welcome line.
- **04 Stories**: first story had no route to the product. Added a product card that jumps to it.
- **12 Tunnel**: surname cut off at the right edge; the next section showed through too strongly. Smaller type, faster fade.
- **16 Sticker Sheet**: a draggable sticker covered the "Get it free" button. Stickers now sit on section corners.
- **19 Swiss Poster**: surname clipped. Resized.
- **21 Airmail**: envelope rendered tiny on phones. Fixed sizing, added a heading and an "Enclosed: My Photo Gallery, Free" line.
- **23 Spreadsheet**: a crash when a click landed on a row that didn't exist on the current sheet. Guarded.
- **24 Blueprint**: footer links were only 18px tall. Enlarged.
- **25 Mosaic**: thin italic strokes made the tiled name hard to read. Heavier weight, denser tiles.

## Pass 2: all 25 together, phone and desktop side by side

- **06 Holo Cards**: the idle foil sway never stopped, so buttons kept moving under your thumb. It now sways for about four seconds on arrival, then holds still.
- **Product prominence**: on seven scroll-led sites the first screen didn't mention My Photo Gallery. Added an on-theme pointer to each:
  - 02 Darkroom: "First print: My Photo Gallery, Free ↓"
  - 10 Museum: "Next room: My Photo Gallery, free →"
  - 11 Deep Dive: "Dive to My Photo Gallery ↓"
  - 12 Tunnel: "Next: My Photo Gallery, free →"
  - 19 Swiss Poster: header link
  - 20 Zine: "Inside: a free app"
  - 25 Mosaic: champagne pill under the name
- **19 Swiss Poster**: first line still clipped at 390px wide. Smaller again.

## Pass 3: behaviour, email flow and reduced motion (59 of 59 passed)

- Each site's own interaction was driven like a visitor would: shutter, swipes, drawers, keypad, terminal commands, page turns, window dragging, sheet tabs, loupe, seal, and so on.
- Email flow checked against a stand-in email API: the request format, the download link in the email, opt-in only when ticked, existing subscribers, provider failure messages, and the hidden bot field.
- With nothing configured, every form says nothing was sent. None claims success.
- Every site re-run with reduced motion switched on: no errors, all content present. The tunnel switches to a plain scrolling page.
- **10 Museum**: the portrait was too tall on phones and pushed the "Next room" button under the navigation. Made square.

## Not covered by these passes

- No real phone hardware. Phone checks used Chrome's phone emulation, so tilt (Holo Cards) and Instagram's in-app browser weren't tested on a device.
- No real email was sent. The Resend integration was checked against a local stand-in, because no API key exists yet.
- Safari wasn't tested.

## Design-check notes

The design linter flagged "glow" effects on 02 Darkroom (safelight), 08 Terminal (phosphor), 11 Deep Dive (bioluminescence) and 22 Vending (neon sign). These are kept on purpose because each one is the physical light source of its theme. The one decorative glow it caught, a hover glow on 17 Aurora Glass, was changed to a neutral shadow.

## Site 26: Notes (added later, from a concept the user reviewed)

Designed as a concept board first (`concepts/26-notes/`), revised with the user's feedback, then built.

- Concept rounds: headline changed to her name; the product and its features merged into one wide card; the dot-matrix checklist font dropped; real profile photo and bio added; filter buttons moved onto the preview with a "Try it:" label; the fog title fixed so only the last line blurs; social icons made plain white and the same size; TikTok kept and Facebook added.
- Facebook was added to the shared content and kit, so it now shows on all 26 sites ("not added yet" until a link is set).
- Checks: layout, content and email dialog pass on phone and desktop for all 26 sites; interaction tests 61 of 61, including opening a note, going back and filtering.
