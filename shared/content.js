/* ─────────────────────────────────────────────────────────────
   THE ONE FILE TO EDIT. All the sites read from here.
   Leave a value "" and the site shows an honest "not added yet"
   state rather than a fake link.
   ───────────────────────────────────────────────────────────── */
window.SITE = {
  person: {
    name: "Sairah González",
    first: "Sairah",
    last: "González",
    initials: "SG",
    avatar: "shared/sairah.jpg",
    bio: "Starting from 0 in my 20s, exploring how to make money online as a creative."
  },

  socials: [
    { id: "instagram", label: "Instagram", url: "" },   // TO ADD
    { id: "tiktok",    label: "TikTok",    url: "" },   // TO ADD
    { id: "youtube",   label: "YouTube",   url: "" },   // TO ADD
    { id: "facebook",  label: "Facebook",  url: "" }    // TO ADD
  ],

  product: {
    name: "My Photo Gallery",
    price: "Free",
    kind: "Desktop HTML app",
    description: "Browse, search, filter and organise the photos and videos stored on your computer or external hard drive.",
    promise: "No cloud storage. No subscriptions.",
    compat: "Desktop only",
    compatNote: "Runs on a computer, not on phones or tablets. On your phone? Get the link by email and open it on your computer.",
    screenshot: "",                   // TO ADD: real screenshot. Replaces the illustrative preview everywhere.
    details: []                       // TO ADD: your product details, one string per line
  },

  // featured: true highlights a link. A link with no url shows as "Coming soon".
  links: [
    { id: "gallery",   label: "My Photo Gallery",          note: "Free desktop app", tag: "Free", featured: true, action: "get" },
    { id: "resources", label: "Free resources",            note: "Coming soon", url: "" },
    { id: "apps",      label: "Apps",                      note: "Coming soon", url: "" },
    { id: "prompts",   label: "Prompts",                   note: "Coming soon", url: "" },
    { id: "guides",    label: "Guides",                    note: "Coming soon", url: "" },
    { id: "projects",  label: "My website", note: "Coming soon", url: "" }
  ],

  building: {
    name: "Something new",                 // TO ADD: your current project name
    status: "In progress. Details soon.",  // TO ADD: a short progress update
    url: ""                                // TO ADD (optional): link to follow along
  },

  newsletter: {
    intro: "Get updates when new apps, prompts and guides are ready.",
    consent: "Also email me about future products and offers (optional)"
  },

  download: {
    intro: "I'll email you the app.",
    optIn: "Also add me to the newsletter (optional)"
  },

  footer: {
    email: "sairah.gonzalezz@gmail.com",
    credit: "© 2026 Sairah González"
  }
};
