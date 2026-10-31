# Slide Outline: ScholarPath Navigator (7 slides)

**Style tips:** one idea per slide, large text, at most 4 bullets, one visual per slide. Footnote on every slide that shows data: *"Illustrative data modeled on real schemes."* Do not put any national statistic on a slide unless you have a source for it.

---

## Slide 1: Title and Team
- **ScholarPath Navigator**: Smart Scholarship & Student Support Navigator
- ISTE HackNova 2026, Problem Statement 13
- Team: *(names and roles: M1 Backend and Data, M2 Frontend, M3 Engine and Pitch)*
- Tagline: *Know what you qualify for. Know why. Never miss the deadline.*

**Screenshot/visual:** none needed; use the logo or a simple graduation-cap icon.

---

## Slide 2: The Problem
- Scholarships are scattered across many portals (NSP, MahaDBT, AICTE, private foundations)
- Eligibility rules are buried in PDFs: income caps, category, gender, course level, documents
- Rejections come with no reason, so students can't fix anything
- Certificates take time; students learn about missing documents too late

**Screenshot/visual:** a simple four-icon row (scattered, confusing, silent, late). Optional: a mock "Not eligible" message with no explanation.

---

## Slide 3: Why Existing Portals Fall Short

| Pain point | What students get today | What they need |
|---|---|---|
| Discovery | Search each portal separately | One profile, one match |
| Eligibility | Read the PDF and guess | Instant, personalized result |
| Rejection | "Not eligible" | The exact failed rule |
| Deadlines | Find out too late | Automatic reminders and missing-document alerts |
| Trust | Fake or outdated listings | Admin-verified listings |

**Screenshot/visual:** the table itself.

---

## Slide 4: Our Solution
- **Three-way match:** Matched, Partially Matched, Ineligible
- **Transparent reasons:** "Income exceeds the ₹1,60,000 limit by ₹20,000"
- **Deadline and document reminders:** a scheduled job flags what closes soon
- **Admin verification:** new listings stay hidden until approved

**Screenshot/visual:** the three tabs with their counts (4 / 3 / 3) for Ananya.

---

## Slide 5: Live Demo / Screenshots
- Student 1 (Ananya, OBC, ₹1.8L income): 4 matched, 3 partial, 3 ineligible
- A partial card: "Missing: Income Certificate" with days left
- An ineligible card: red pill with the exact reason
- Student 2 (Rohan, high income): same engine, very different, fully explained result

**Screenshots to capture (in this order):**
1. Ananya, Matched tab (4 green cards)
2. Ananya, Partially Matched tab, close-up of one amber "Missing:" pill and the days-left chip
3. Ananya, Ineligible tab, close-up of the "exceeds by ₹20,000" red pill
4. Deadline Cron Check banner listing 3 alerts
5. Admin view with the verify button, then Matched showing 5
6. Rohan's results (1 matched, rest ineligible)

---

## Slide 6: Architecture
- **Frontend:** React + Vite + Tailwind (single-page dashboard)
- **API:** Node.js + Express REST (`/api/evaluate`, `/api/scholarships`, `/api/reminders/trigger`)
- **Rule engine:** one pure function, six checks, deterministic and explainable
- **Scheduler:** deadline and missing-document job (simulated by a button in the demo)

**Screenshot/visual:** a left-to-right diagram: Student UI → Express API → Rule Engine → Scheduler/Alerts, with the in-memory scheme data under the API.

---

## Slide 7: Impact and Next Steps
- **Impact:** students see opportunities, understand rejections and act before deadlines
- **Scale:** swap in-memory data for a database; ingest real NSP and MahaDBT sources
- **Reach:** SMS, email and WhatsApp alerts; regional-language interface
- **Trust:** source links, expiry dates and periodic re-verification of listings

**Screenshot/visual:** a simple roadmap arrow: Prototype → Pilot with one college → Real data sources → Multi-language and SMS.

**Closing line (say it, don't put it in small print):** *Know what you qualify for, know why, and never miss the deadline.*
