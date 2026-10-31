# Judge Q&A: 8 Tough Questions and 20-Second Answers

Each answer is about 50 words. Say it calmly, then stop. Do not volunteer extra weaknesses.

**1. Is your scholarship data real and accurate?**
> "The demo data is illustrative, modeled on real programs, and we label it that way. In production, each scheme would come from an official source, carry a source link and a 'last verified' date, and stay hidden from students until an admin approves it. That's exactly the admin toggle you saw."

**2. Why a rule engine instead of an LLM?**
> "Eligibility is a yes-or-no decision with real consequences, so it must be deterministic and auditable. A rule engine gives the same answer every time and can show which rule failed. An LLM could help later to read scheme PDFs into rules, but a human would verify them before students rely on them."

**3. Will it scale to thousands of schemes and users?**
> "The engine is a stateless function, so checking one student against thousands of schemes is trivial and every request is independent. Scaling means replacing our in-memory list with a database and running more API instances behind a load balancer. The matching logic doesn't change."

**4. What about student privacy? Income and caste are sensitive.**
> "Our design principle is data minimization. The matching only needs a profile and a checklist of which documents a student holds, not the documents themselves. In production we'd add consent, encryption, no data sharing or selling, and the right to delete. The demo uses no real personal data."

**5. How would the scheduled job work in production?**
> "What you saw is the real logic, triggered by a button for the demo. In production the same function runs on a scheduler, once a day, finds deadlines within a set window, and hands the alerts to a messaging service for SMS, email or WhatsApp. Only the trigger and the delivery change."

**6. How do new scholarships get verified?**
> "New listings are created as unverified and are invisible to students. An admin reviews the source and approves with one click, and the matches update immediately. Next steps would be a mandatory source link, an expiry date, and periodic re-verification so stale listings drop out."

**7. Criteria change every year. How do you keep up?**
> "Criteria are data, not code. Updating an income cap or a deadline means editing a record, not redeploying the app. Each record would show when it was last verified, and expired deadlines would hide automatically. Students and institutions could also flag outdated entries for review."

**8. What's the adoption or business model?**
> "Free for students, because that's where the impact is. Realistic partners are college scholarship cells, NGOs and foundations who want better-matched applicants, and institutions that could use an admin dashboard. We'd start with one college or district, measure applications completed, then expand."

---

## Bonus: if the judge asks something you can't answer
> "That's outside what we built in this sprint, but here's how we'd approach it..." then give one concrete step. Never invent a statistic. If asked about the national unclaimed amount: "We haven't verified a figure we'd be comfortable quoting, so we'd rather not guess."

## Bonus: likely follow-ups
- **"What does Partially Matched mean?"** You meet the eligibility criteria but a document is missing (or your GPA is within 0.5 of the requirement). It tells you exactly what to fix.
- **"What makes someone Ineligible?"** A hard rule fails: income, category, gender, education level, or a GPA far below the cut-off. We show every failed rule.
- **"Is there login?"** Not in this prototype. It uses preset student profiles so the demo stays reliable. Authentication is a next step.
