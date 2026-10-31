# ScholarPath Navigator: 3-Minute Pitch Script

**Total speaking time:** 3:00. Roughly 130 spoken words per minute, so the demo parts are mostly clicking with short lines. Rehearse with a timer.

> **Data note:** All scheme data in the demo is illustrative, modeled on real programs (AICTE Pragati, MahaDBT, Tata Capital Pankh, Reliance Foundation, Central Sector Scheme). Say this once, clearly, so no judge can catch you on a wrong figure.
>
> **No unsourced statistics.** The original blueprint mentions "₹2,000 Cr unclaimed". That figure has **no source** yet. Do not say it unless you find a citation. The script below uses qualitative wording instead.

## Before you go on stage (pre-flight, 2 minutes)
- [ ] Backend and frontend running (`npm run dev`). No "Backend offline" banner on screen.
- [ ] **Restart the backend** so scheme 11 is unverified again (state is in memory).
- [ ] Browser on `http://localhost:5173`, Student view, **Ananya** selected, Matched tab visible, zoom at 100% or 110%.
- [ ] Expected start state: Matched **4**, Partially Matched **3**, Ineligible **3**.
- [ ] Backup screen recording ready to play if anything breaks.

---

## [0:00 – 0:45] The Problem

> "Scholarships exist. Students still miss them. Not because the money isn't there, but because finding it is broken.
>
> Schemes are scattered across NSP, MahaDBT, AICTE and dozens of private foundations. Each one has its own income cap, category rules and document list, buried in PDFs.
>
> When a student is turned down, the portal says 'not eligible' and nothing else. No reason. Nothing to fix.
>
> And documents like an income certificate take weeks to get. Students find out they need one after the deadline has passed.
>
> We built **ScholarPath Navigator**: it tells you what you qualify for, why you don't, and what to do before time runs out."

**Delivery tips:** slow down on "No reason. Nothing to fix." That is the hook. Hold up one finger for each of the three failures (scattered, silent, late).

---

## [0:45 – 2:00] The Live Demo (six beats, about 15 seconds each)

| Time | You click | You say |
|---|---|---|
| 0:45 – 0:55 | Point at the profile bar (Ananya selected), click **Find Scholarships** | "Meet Ananya: first-year student, OBC, family income ₹1.8 lakh, GPA 8.4. One click." |
| 0:55 – 1:10 | Show the Matched tab (4 cards), then open **Partially Matched** and point at a card with the amber "Missing:" pill | "Four schemes she can apply to today. Three more she qualifies for, but she's missing a document. Here: an income certificate, with the deadline counting down. She knows what to get, and by when." |
| 1:10 – 1:22 | Open the **Ineligible** tab, point at the red pill on *Merit-cum-Means Support Grant* | "And where she doesn't qualify, we say exactly why: income exceeds the limit by ₹20,000. Not just 'rejected'." |
| 1:22 – 1:35 | Click **Run Deadline Cron Check**, point at the banner | "Our scheduled job scans deadlines. Three schemes close within a week. It flags each one with the documents she still needs. In production this becomes an SMS or email." |
| 1:35 – 1:50 | Switch to **Admin**, click Verify on *Community Skill Development Grant*, switch back to Student | "Listings are verified before students see them. I'll approve this one..." *(Matched goes from 4 to 5)* "...and her matches update instantly." |
| 1:50 – 2:00 | Click the **Rohan** preset | "Different student, higher income: the same engine gives a very different, and still fully explained, result." |

**If you run short on time, cut in this order:** (1) the Rohan contrast, (2) the "Why you qualify" detail, (3) shorten the cron line.

**After the demo:** unverify scheme 11 again (or restart the backend) so the next run starts from 4 matched.

---

## [2:00 – 2:30] Architecture

> "Under the hood it's simple on purpose. A React and Tailwind front end talks to a Node and Express REST API. Every decision comes from one rule engine: six checks on GPA, income, category, gender, education level and documents. It's deterministic, so every result is explainable and nothing is a black box.
>
> The reminder job reuses the same engine to find deadlines that are close and documents that are missing."

**Slide to show:** the architecture slide (React → Express API → rule engine → scheduler).

---

## [2:30 – 3:00] Impact, Scalability and Wrap

> "Because the engine is a stateless function and schemes are data, not code, scaling means swapping our in-memory list for a database and plugging in real sources like NSP and MahaDBT. The same reminder job can send SMS, email or WhatsApp, and the interface can be translated into regional languages.
>
> For a student, that's the difference between a rejection with no explanation and a clear list: apply now, get this document first, or here's exactly why not.
>
> ScholarPath Navigator: know what you qualify for, know why, and never miss the deadline. Thank you."

---

## Numbers you may safely say
- "Ten verified schemes in the demo, plus one pending approval." (true for the demo data)
- "Six eligibility checks." (true for the engine)
- Anything about national totals or unclaimed amounts: **needs a source** before it goes on a slide or into the script.
