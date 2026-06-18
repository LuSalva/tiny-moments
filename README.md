# 🌱 Tiny Moments

**A family memory keeper — built with AI, shipped in a weekend.**

[**→ Try the live app**](https://tiny-moments-five.vercel.app) · Demo login: `demo@tinymoments.app` / `TinyDemo2024`

---

## What is this?

Tiny Moments is a private web app for parents who want to capture the small things that don't make it into a photo album — a funny quote, a first word, a drawing that will inevitably end up in the bin.

You can log memories and artworks, add photos, filter by person or date, and generate a printable PDF diary at the end of the year.

The demo is pre-loaded with fictional memories from **Lena**, a 4-year-old who loves puddles, Frozen, and building cushion forts.

---

## How I built it

This project started at a workshop by **[Women in AIndhoven](https://www.linkedin.com/company/women-in-aindhoven/)** — a community for women in AI and tech enthusiasts in Eindhoven. The workshop, led by **Wanda Kruijt**, brought together 13 women who — in 3 hours — each built a fully functional app using AI. No prior coding required.

The premise: you don't need to write code. You need clarity about what you want to build.

I kept going after the workshop. This is the result.

The entire app was built using **vibe coding** — describing what I wanted in plain language and working with Claude (Anthropic's AI) to implement it step by step. I made decisions about features, design, and data. Claude wrote the code.

---

## What's under the hood

| Layer | Tool |
|---|---|
| Frontend | React + Vite |
| Backend & database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Vercel |
| PDF generation | jsPDF |
| Data protection | Row Level Security (RLS) |

Photos are stored as compressed base64 in the database — no public URLs, protected by RLS policies. Built with privacy in mind from the start.

---

## Features

- Log memories by type: quote, photo, milestone, song, creation, memory
- Art gallery tab for drawings and crafts
- Add photos from camera or gallery
- Filter memories by person
- Generate a printable PDF diary (memories or art gallery)
- Multi-user: each family member logs in separately
- PWA-ready: works on mobile, can be installed as an app

---

## About the community

**[Women in AIndhoven](https://www.linkedin.com/company/women-in-aindhoven/)** is a community for women working or interested in AI in the Brainport Eindhoven region. Founded by Meike Nauta, Mariana Goldak-Altgassen and Andrea van den Boogaard, they organize bi-monthly events at the AI Innovation Center in Eindhoven.

Their mission: inspire and provide women with the knowledge, confidence, and community they need to thrive in the AI world.

> *"Building with AI isn't about coding skills. It's about clarity, preparation, and the willingness to trust the process."*

The vibe coding masterclass was led by **Wanda Kruijt**, with the full Women in AIndhoven team. 13 women, 3 hours, 13 fully functional apps.

Follow them on [LinkedIn](https://www.linkedin.com/company/women-in-aindhoven/) to find out about their next event.

---

## Want to run it yourself?

You'd need your own Supabase project with the entries, artworks, and profiles tables, and your own Vercel deployment. Feel free to reach out if you want to know more.

---

*Built by [Luciana Salvagni](https://www.linkedin.com/in/lucianasalvagni/) · Eindhoven, 2025*
