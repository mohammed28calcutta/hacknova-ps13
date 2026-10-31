# ScholarPath Navigator (HackNova PS13)

Smart Scholarship & Student Support Navigator. Match a student profile against scholarships, explain why each one is Matched / Partial / Ineligible, flag deadlines within 14 days, and let an admin verify listings.

> All scholarship data is **illustrative** (simplified for the demo).

**Stack:** Node.js + Express (port 5001) and React + Vite + Tailwind (port 5173).

## Who owns what (only edit your own files!)

| Member | Owns |
|---|---|
| M1 (Mohammed) | `server/server.js`, `server/data.js`, `server/smoke.js`, root `package.json`, `README.md`, `.gitignore` |
| M2 | everything inside `client/` |
| M3 | `server/engine.js`, `server/engine.test.js`, everything inside `docs/` |

## Run the project

You need Node.js 18 or newer (`node -v` to check). Run these from the `hacknova-ps13` folder, in **Command Prompt (cmd)**:

```
npm run install:all     (install everything, once)
npm run dev             (starts backend 5001 + frontend 5173)
npm test                (engine tests, no server needed)
npm run smoke           (checks the live API, server must be running)
```

Open http://localhost:5173

## Git for beginners (copy-paste cheat sheet)

Git is just a "save and share" tool. Three words matter:
- **commit** = save a snapshot on your own computer
- **push** = upload your snapshots to GitHub
- **pull** = download your teammates' snapshots

### One-time setup (everyone)
1. Install Git from https://git-scm.com/download/win (click Next on everything).
2. Open cmd and run (use your own name and GitHub email):
```
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### M1 only: put the project on GitHub (once)
1. On github.com click **New repository**, name it `hacknova-ps13`, leave it empty (no README), click Create.
2. **Add teammates:** repo **Settings > Collaborators > Add people**, add M2 and M3 by username. They must accept the email invite, otherwise they cannot push.
3. In cmd inside the `hacknova-ps13` folder:
```
git init
git add .
git commit -m "Initial skeleton"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hacknova-ps13.git
git push -u origin main
```
A browser window will ask you to sign in to GitHub. Do it once.

### M2 and M3: get the project (once)
```
git clone https://github.com/M1-USERNAME/hacknova-ps13.git
cd hacknova-ps13
```

### Daily routine (everyone, every ~30 minutes)
```
git pull --rebase            (1. get the latest from teammates)
git status                   (2. see what you changed)
git add .                    (3. choose all your changes)
git commit -m "what I did"   (4. save a snapshot)
git pull --rebase            (5. again, in case someone pushed meanwhile)
git push                     (6. upload)
```
Always **commit before you pull**. If git refuses to pull, it is because you have unsaved changes: run steps 3 and 4 first.

### If something goes wrong
| Message | What to do |
|---|---|
| `rejected ... fetch first` or `non-fast-forward` | Run `git pull --rebase`, then `git push` again |
| `You have unstaged changes` when pulling | Run `git add .` and `git commit -m "save"`, then pull again |
| Merge conflict | You edited a file you do not own. Take the owner's version (`git checkout --theirs <file>` or ask them), then tell them what you needed |
| `Permission denied` / 403 on push | M1 has not added you as a collaborator yet, or you did not accept the invite |
| `fatal: not a git repository` | You are in the wrong folder. `cd hacknova-ps13` first |

Never commit `node_modules` (the `.gitignore` already blocks it).
