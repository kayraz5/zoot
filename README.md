# LayQuest

**Your layover, already quested.** LayQuest turns 6–14 spare hours in Singapore into a timed walking quest: the planner builds a schedule that fits the clock, a tilted 3D toy-city map makes it playable, and passport chops prove you were there.

SMU IS216 · Section G3 · Group 4 · Vue 3 + Vite + Bootstrap 5 + Pinia + Supabase + Vercel + Groq, with MapLibre GL, Three.js and Turf.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
npm run test:planner   # headless checks: golden path, rain swap, refusals, Groq pipeline
```

No keys are required. With nothing configured the app runs in **guest mode**: data lives in `localStorage`, the deterministic planner builds every mission, and the map uses free OpenFreeMap tiles. Add keys to switch on Supabase and Groq (see below).

## Environment variables

Copy `.env.example` to `.env` locally, and add the same keys in Vercel → Project → Settings → Environment Variables.

| Key | Where it is read | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | browser | Auth (magic link), Postgres, RLS. Public by design. |
| `GROQ_API_KEY` | `/api/*` only (server) | Groq picks places and writes copy. **Never prefix with `VITE_`.** |
| `GROQ_MODEL` | `/api/*` | Defaults to `llama-3.3-70b-versatile`. |
| `VITE_DEV_PANEL` | browser | `1` shows `/dev` and demo walk (fake GPS) in production. **Set it on the grading deployment.** |

`npm run dev` mounts the Vercel functions in `/api` through a small Vite plugin, so Groq works locally with the key in `.env`. `npm run preview` does not serve `/api`, so there the app uses the offline planner.

## Grading-day demo script (Jackson)

1. Open the Vercel URL on a phone → **Start a layover** → **Continue as guest** (or use the email magic link) → quiz → *Budget*.
2. `/plan`: **Changi T3**, **8 h**, interests **Hawker · Gardens · Photo** → **Build my quest**.
   - The buffer bar shows 30 min exit immigration + 45 min check-in/security + 45 min safety. The mission ends at T3 with ≥ 90 min to the gate.
3. **Play on map**: the pastel 3D Singapore, the traveller, a dotted path, and a pulsing totem at stop 1. The HUD shows **TIME TO GATE** (amber < 90 min, red < 45) and "Head back by …".
4. Tap the joystick (demo walk), then **Arrive** (teleports 220 m from the stop). Tap the ground inside the ring, or use WASD. When the Stamp button glows, press it: +XP, chop celebration, and a new passport page.
5. **See chop** → the 3D passport flips to that area and a rubber stamp slams the chop onto the page.
6. Walking near an off-path gem pings a **sidequest** toast. The FAB lists it, and it's greyed out as "Not enough time" if it would break the buffer.
7. `/dev` → **Force rain** → back on Mission: the outdoor Gardens leg is flagged, and **Indoor rewrite** swaps it for indoor stops, leaving stamped legs untouched.
8. 14-hour variant: same flow with 14 h and *Adventurous*. Evening stops (Garden Rhapsody, Spectra) appear, and after about 23:30 the plan switches from MRT to taxi because the trains stop.

## How the planner works

```
/plan form ─► computeBudget()  exit 30 · re-entry 45 · safety 45 (airport) / 20 (hotel)
          ─► buildCandidates() interests, window size, indoor/rain, exclusions
          ─► Groq (/api/plan)  picks 3–6 place_ids + "why" copy   ← layquest.choice.v1
               │ validateChoice() → retry once → else ↓
               ▼
          ─► deterministic planner: Turf radius clusters (1.2 km) → greedy nearest-neighbour
             with variety + time budget → MRT when walk > 18 min (static graph, transfer
             penalty, closes 23:30) → mandatory "Return to origin" leg
          ─► validateMission()                                    ← layquest.mission.v1
```

- **Groq never produces minutes or coordinates.** It returns ids and copy; `sequencePicks()` times every leg with Turf and the MRT graph. Ids outside the catalog slice, extra fields such as `travel_min`, or a wrong schema are all rejected (`src/lib/itinerarySchema.js`).
- **The planner refuses** rather than risk the flight: fewer than 60 usable minutes, no place that fits, or a place that can't be left in time to make `arrive_by` all get a refusal.
- **Mid-walk replans** (*I'm behind*, *Less walking*, *Swap next stop*, *Rain plan*) keep stamped legs and replan from the traveller's current position and time.

## Project structure and team lanes

| Member | Lane | Files |
| --- | --- | --- |
| Kayra Zalfa Alimaa | Supabase schema, seed, `stamp_place` RPC, RLS, Groq route | `supabase/`, `scripts/gen-seed.mjs`, `api/`, `src/lib/db/remote.js`, `src/lib/planner.js` |
| Nathanael Steven Chiang | Auth, guards, profiles, onboarding | `src/stores/user.js`, `src/router/`, `src/views/AuthView.vue`, `OnboardView.vue` |
| Ganaden Matt Eudale Corpuz | Bootstrap views, landing, planner form, place page | `src/views/LandingView.vue`, `PlanView.vue`, `PlaceView.vue`, `MissionView.vue`, `src/components/` |
| Shrey Chauhan | 3D map, avatar, quest path, passport | `src/map/`, `src/gl/`, `src/views/MapView.vue`, `PassportView.vue` |
| Matthew Tjandera | Vercel, env, CI preview, design QA, dark mode, PWA | `vercel.json`, `vite.config.js`, `.env.example`, `src/styles/app.css`, `public/manifest.webmanifest` |
| Hulbert Koh Ming Ren | Weather, advisories, place content + Groq summaries, sidequests | `src/lib/weather.js`, `src/data/`, `api/summary.js`, `src/views/SwipeView.vue` |

```
api/                 Vercel functions: plan.js (Groq chooser), summary.js (place blurb), _lib/groq.js
scripts/             gen-seed.mjs (→ supabase/seed.sql), test-planner.mjs
supabase/            schema.sql (tables, RLS, RPCs), seed.sql (generated)
src/data/            places.sg.json (89 POIs), origins, interests, styles, areas, sidequests
src/lib/             planner, travel (Turf + MRT graph), hours, itinerarySchema, groq client,
                     weather (Open-Meteo), geo (GPS + fake GPS), checkin rules, db adapters
src/stores/          user, trip, mission, passport, ui, party   (Pinia)
src/map/             MapLibre style, QuestMap component, quest path / geofence layers
src/gl/              Three.js: avatar, markers, worldLayer (custom layer), passport book, page art
src/views/           one view per route in the IA table
```

## Supabase setup (about 5 minutes)

1. Create a free Supabase project. In **SQL Editor**, run `supabase/schema.sql`, then `supabase/seed.sql`.
2. In **Authentication → URL Configuration**, add your site URL and `https://<your-vercel-app>/auth` as a redirect URL. Google sign-in is optional (`signInWithGoogle` is already wired in `remote.js`).
3. Put the project URL and anon key in `.env` and in Vercel.
4. **Demo user:** sign in once with the team's shared inbox through the magic link and write the address here for the instructor. Guest mode also works with no account.
5. Before real users arrive, turn off server-side fake GPS: `update app_config set value = '0' where key = 'dev_fake_gps';`

`stamp_place()` re-checks every check-in on the server: 80 m radius (120 m when accuracy is worse than 50 m), accuracy over 150 m rejected unless fake GPS is allowed, one stamp per place per Singapore day, and XP added server-side. Clients have no insert policy on `stamps`, and a trigger stops them from editing their own XP. After editing `src/data/places.sg.json`, regenerate the seed with `npm run seed:sql`.

## Deploy to Vercel

Import the repo into Vercel (the framework is detected as Vite; `vercel.json` adds the SPA rewrite). Add the environment variables above, including `VITE_DEV_PANEL=1` for the grading build, then deploy. `/api/plan` and `/api/summary` deploy automatically as Node functions.

## Scope status

| Tier | Feature | Status |
| --- | --- | --- |
| P0 | Auth (magic link + guest) and 4-style quiz | ✅ |
| P0 | Layover form with origin presets, hours slider, return time, interests | ✅ |
| P0 | Groq chooser + schema validator + retry + deterministic fallback | ✅ (Groq path unit-tested with a mocked API; needs a real key to demo live) |
| P0 | Turf clustering, walk/MRT/taxi times, MRT hours | ✅ |
| P0 | 3D map, avatar, dotted quest path, totems, geofence | ✅ |
| P0 | Geofenced stamps + XP (client mirror + server RPC) | ✅ |
| P0 | Time-to-gate HUD, Open-Meteo rain overlay and indoor rewrite | ✅ |
| P0 | 3D flip passport with chop slam | ✅ |
| P0 | Place page: postcard art, AI summary with stored fallback | ✅ |
| P1 | Sidequests on the map + swipe deck | ✅ |
| P1 | Dark/light mode, bookmarks, profile page | ✅ |
| P1 | Parties + realtime chat | Tables, RLS and Realtime publication are ready; the UI is a stub (`/party`) |
| P1 | GDACS advisories + severity tint | `advisories` table + demo row only |
| P2 | TikTok/Lemon8 embeds, visa snippet, flight links | Static ICA and flight-search links on `/me`; no embeds yet |

## Honest notes

- Place coordinates and hours are hand-curated and should be spot-checked before the demo, especially temporary closures.
- Place art is procedural. Add real photos through `places.image_url` (with licences you're allowed to use).
- Travel times come from a simplified MRT graph with average waits, not live transit data. Taxi times are distance-based estimates.
- The Supabase adapter was checked against a local Postgres with a stubbed `auth` schema (schema, seed, RPC rules, RLS, XP guard), but not yet against a live Supabase project.
- No Pokémon names, assets or trademarks appear in the UI or repo. The GO-style feel comes from original low-poly meshes and styling.

## Credits

Map data © OpenStreetMap contributors · tiles and fonts by OpenFreeMap · weather by Open-Meteo · icons by Bootstrap Icons · fonts Fredoka and Nunito (Google Fonts).
