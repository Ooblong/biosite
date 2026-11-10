# Twenty-six ways in

26 link-in-bio sites for Sairah González, plus a gallery to compare them.

## Run it

```
node server.js
```

Then open http://localhost:4173. No install needed (Node 18+).

## Where things live

| What | Where |
|---|---|
| All the words, links and settings | `shared/content.js` (edit this one file; all 26 sites update) |
| Shared behaviour: forms, product preview, dialogs | `shared/kit.js`, `shared/kit.css` |
| The 26 sites | `sites/01-viewfinder/` … `sites/26-notes/` (each is one `index.html`) |
| Gallery / switcher | `index.html` |
| Privacy policy (draft) | `privacy.html` |
| Email sending | `api/` (works locally through `server.js`, and as Vercel functions) |

## Still to fill in

Open the gallery and press **Setup checklist** to see live status. In short:

- Profile picture: `person.avatar`
- Instagram, TikTok and YouTube URLs: `socials[].url`
- Contact email: `footer.email`
- Current project name and status: `building`
- Product details: `product.details`
- A real product screenshot: `product.screenshot` (until then each site shows an interactive preview with sample pictures, labelled "Illustrative preview")
- Links for resources, apps, prompts, guides and projects (they show "Coming soon" until set)
- Email delivery: copy `.env.example` to `.env` and add a Resend API key, a sender address on a verified domain, and the real download URL
- Have `privacy.html` reviewed

Nothing is faked. Until email is set up, the forms tell visitors "Not connected yet … nothing was sent".

## Tests

```
node tools/qa.mjs          # layout, content and form checks, phone + desktop
node tools/interact.mjs    # each site's interactions, email flow, reduced motion
node tools/thumbs.mjs      # refresh gallery thumbnails
```

The tools need `npm install` inside `tools/` (Playwright) and a local Chrome.
