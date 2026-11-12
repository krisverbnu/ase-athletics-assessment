# Challenges and how they were solved

A log of the real problems hit while building this app, newest first. Each entry follows the same shape: **symptom** (what I saw), **cause** (what was really going on), **fix**, **lesson**.

A note on context: I built this with Claude Code as a coding assistant. Some entries mention files being "copied onto the Mac": the assistant wrote and tested code in its own environment, and changes were then copied into my local repository. See [AI assistance](../README.md#ai-assistance).

## Contents

| Area | Challenge |
|---|---|
| Workflow | [Commits that were too big to follow](#commits-that-were-too-big-to-follow) |
| Frontend | [Chart clicks didn't say which bar was clicked](#chart-clicks-didnt-say-which-bar-was-clicked) |
| Repository | [Stray files committed: duplicate workflows and unused Neon setup files](#stray-files-committed-duplicate-workflows-and-unused-neon-setup-files) |
| Deployment | [Live site: login blocked by CORS](#live-site-login-blocked-by-cors) |
| Frontend | [Chart legends and tooltips in the wrong order](#chart-legends-and-tooltips-in-the-wrong-order) |
| Frontend | [Mobile check: invisible text widening the page, and cut-off player rows](#mobile-check-invisible-text-widening-the-page-and-cut-off-player-rows) |
| Security, performance | [Any scout could edit another scout's report, and the app was slow to first load](#any-scout-could-edit-another-scouts-report-and-the-app-was-slow-to-first-load) |
| Tooling | [`code` command not found](#code-command-not-found) |
| Testing | [Making the code testable, and a test that was wrong](#making-the-code-testable-and-a-test-that-was-wrong) |
| Frontend | [Contracts card too cramped, and the dashboard scrolled sideways on phones](#contracts-card-too-cramped-and-the-dashboard-scrolled-sideways-on-phones) |
| Workflow | [Dashboard still went white after the fix](#dashboard-still-went-white-after-the-fix) |
| Local setup | ["Cannot reach the server" after restarting](#cannot-reach-the-server-after-restarting) |
| Frontend, API | [Dashboard went white after the contracts update](#dashboard-went-white-after-the-contracts-update) |
| Various | [Earlier challenges in the build](#earlier-challenges-in-the-build) |

## Commits that were too big to follow

Not a bug, but a working habit I changed partway through.

**Symptom.** Looking back at the history, the early commits are each a whole feature: "Add frontend: auth, layout, player list, profile and form" is 38 files and about 2,600 lines, and "Add full REST API" is 27 files. One later commit bundled documentation, Prettier, linting and a new workflow into 85 files. A reviewer can't easily see what changed and why, and if one part had broken something, it couldn't have been undone on its own.

**Cause.** At the start I was building fast and committing at milestones ("the frontend works now") rather than after each change. When several unrelated tasks were finished together, they went into one commit.

**Fix.**

1. Switched to one commit per change: the dashboard links, then moving them into a tested helper, then making the club names keyboard links, each with its own commit and a message saying what it does.
2. When several steps touch the same file, did them one at a time: make the change, commit, push, then the next.
3. Left the earlier history as it is rather than rewriting it with a force push: it's an honest record of how the project was built.

**Lesson.**

- One commit = one change you could describe in a sentence. If the message needs "and" twice, it's probably two commits.
- Small commits are easier to review, easier to undo, and make `git log` read like a diary of the project.
- Commit when something works, not when everything works.

## Chart clicks didn't say which bar was clicked

Making the dashboard clickable (top scorer to his profile, each position, club or age group to those players) worked for the cards and links straight away, but not for the bars.

**Symptom.** Clicking a bar in "Goals and assists by position" did nothing. Logging what the chart passed to the click handler showed `activeIndex: null` and no `activeLabel`: Recharts knew where the click happened, but not which position it was on.

**Cause.** The click was attached to the whole chart, which relies on the tooltip's "active" state to know which category is under the mouse. In Recharts 3 that state wasn't set at the moment of the click, so the handler had nothing to go on.

**Fix.**

1. Moved the click onto the bars themselves: each bar's own data includes its position or club.
2. Gave each bar an invisible full-height background, so short bars (goalkeepers) are still easy to hit.
3. Limited the hand cursor to the parts that can be clicked, so it never shows over gaps where clicking does nothing.
4. Added real links for keyboard and screen reader users, because chart shapes can't be focused: a row of position links under the chart, age legend rows as links, and club names drawn as links inside the chart.
5. Moved the link-building into `utils/dashboardLinks.js` and tested it (each link keeps the dashboard's filters and adds one).

**Lesson.**

- When a handler does nothing, log what it receives before guessing. One line showed the data simply wasn't there.
- Attach clicks to the thing that owns the data (the bar), not to its container.
- Anything you can do with the mouse on a chart should also exist as a normal link.

## Stray files committed: duplicate workflows and unused Neon setup files

While checking the repo before making it public, some files turned up that the app never uses.

**Symptom.** A folder with second copies of `ci.yml` and `keep-awake.yml` sat next to `.github/workflows`. At the top level there were also `neon.ts`, `package.json` and `package-lock.json`, which nothing in the app refers to.

**Cause.**

- The workflow files had been downloaded into the project folder, and `git add .` committed everything new, including that folder.
- The top-level Neon files were created early on by Neon's setup tool. Render only builds `backend`, Vercel only builds `frontend`, and CI runs inside those two folders, so these files did nothing.

**Fix.**

1. Checked the copies were identical to the real workflows, and that GitHub only runs files from `.github/workflows`.
2. Checked that the secret files next to them (`.env.local`, `.neon`) had never been committed and are covered by `.gitignore`.
3. Removed the stray files with `git rm`, and added a local-only ignore rule (`.git/info/exclude`) so downloads can't be committed by accident.

**Lesson.**

- Run `git status` before `git add .` and read the list: anything you don't recognise shouldn't go in.
- Look at the repo the way a reviewer will before making it public: every file should have a reason to be there.

## Live site: login blocked by CORS

The deployed app couldn't log in because the API didn't recognise the frontend's address, so the browser blocked every request.

**Symptom.** On the live Vercel site, logging in showed "Cannot reach the server". Both Vercel and Render dashboards said everything was deployed and healthy. The browser console said: *blocked by CORS policy: No 'Access-Control-Allow-Origin' header*.

**Cause.** CORS is the browser's rule that a page on one domain can only read answers from an API on another domain if the API explicitly allows it. The API allows the addresses in `CLIENT_URL` on Render, and the match has to be exact. The value saved on Render didn't exactly equal `https://ase-athletics-assessment-delta.vercel.app` (a trailing `/`, a typo or an old address is enough).

**Fix.**

1. Corrected `CLIENT_URL` in Render's Environment settings.
2. Made the API strip trailing slashes from `CLIENT_URL`, so the most common version of this mistake can't happen again.
3. Added 3 tests: allows the frontend with or without a trailing slash, allows every address in the list, blocks any other site.

**Lesson.**

- "Cannot reach the server" in the app can mean CORS. The browser console names the real cause; always check it before guessing.
- Green dashboards mean the code deployed, not that the pieces can talk to each other. Test the live site end to end.
- Configuration is code too: validate and normalise it.

## Chart legends and tooltips in the wrong order

The chart library quietly sorted legend and tooltip items alphabetically, so they didn't match the order of the bars and lines.

**Symptom.** On "Goals and assists by position", the Goals bar comes first but the legend and tooltip said "Assists, Goals". On Compare, the radar legend listed players in a different order from the table above it.

**Cause.** Recharts sorts legend items by name and tooltip items by name by default. Nothing in the code asked for that; it's a library default.

**Fix.** One shared chart style file (`utils/chartTheme.js`) used by every chart, which turns the sorting off (`itemSorter: null` for legends, a sorter that keeps the original order for tooltips). Tooltip text also changed from series colours to dark text, which is easier to read; the colour stays on the bars.

**Lesson.**

- Check library defaults; they're decisions someone else made for you.
- Keeping chart styling in one file means a fix like this happens once, not in every chart.

## Mobile check: invisible text widening the page, and cut-off player rows

An automated check of every screen on two phone sizes found three layout problems, one of them caused by text you can't even see.

**Symptom.**

- The Compare page was 546px wide on a 390px phone, so the browser zoomed the whole page out.
- On the phone player list, long names (Alessandro Rodriguez, Aurelien Tchouameni) pushed the position badge and goals off the right edge.
- The compare tick boxes were 16px, too small to tap reliably. On the smallest phone (iPhone SE, 320px), the compare bar wrapped onto 4 lines.

**Cause.**

- Cards in a CSS grid won't shrink below their content unless told to (`min-width: 0`), so the wide comparison table stretched its card.
- Even after that, the page stayed 3–111px too wide. The table has screen-reader-only labels (`sr-only`, which use `position: absolute`). An absolutely positioned element is placed relative to its nearest *positioned* ancestor, which was the whole page, not the scrolling box. So the invisible labels hung past the screen edge.
- In the phone rows, the link didn't have `min-width: 0` either, so the name refused to shorten.

**Fix.**

1. Cards get `min-w-0` and slightly less padding on phones.
2. Every horizontally scrolling box gets `relative`, so hidden labels stay inside it.
3. Phone rows: names shorten with "...", badge and stats never shrink. Compare tabs get less padding on the smallest phones.
4. Tick boxes get a ~40px tap area with padding (they look the same). Removed a nested `<label>` that this created.
5. On phones under 400px, the compare bar drops the "pick at least 2" hint.
6. Re-ran the check on iPhone 13 and iPhone SE across 10 screens: page width equals screen width everywhere, no cut-off rows, no errors.

**Lesson.**

- Measure with code: compare page width to screen width on every page, at the smallest phone you support.
- `overflow: auto` only clips what's positioned inside it; absolutely positioned children need a `relative` parent to stay contained.
- `min-width: 0` is the fix for most "why won't this flex/grid item shrink?" problems.

## Any scout could edit another scout's report, and the app was slow to first load

A code review found that report editing had no ownership check; a build check found the whole app downloaded before the login page could show.

**Symptom.**

- Any logged-in user could change or delete any scouting report, including ones written by other scouts.
- The production build was one 874 kB JavaScript file, loaded in full before the login page appeared.

**Cause.**

- Creating a report saved the logged-in scout as author, but the update and delete code never compared the author with the person asking.
- Every page and the chart library (Recharts) were imported at the top of `App.jsx`, so they were bundled together.

**Fix.**

1. The API now checks ownership before an update or delete: another scout gets **403 Forbidden** ("You can only change your own reports."). Reading stays open to everyone.
2. The frontend hides Edit and Delete on other scouts' reports, and the edit page says who can edit it. The API rule is the real protection; hiding buttons is just good manners.
3. Added tests for report ownership, report validation, and player create, edit and delete, plus the first frontend tests.
4. Pages behind the login now load only when opened (`React.lazy` + `Suspense`). First download went from 874 kB to 340 kB; the chart library loads with the first chart page.

**Lesson.**

- Authentication (who are you?) is not authorisation (what are you allowed to do?). Check both, in the API.
- Never rely on hiding a button for security; anyone can send the request directly.
- Check the build output size, not just whether it builds.

## `code` command not found

The terminal couldn't open VS Code by name because the `code` command was never installed on the Mac.

**Symptom.** Running `code .github/workflows/ci.yml` printed `zsh: command not found: code`.

**Cause.** VS Code on macOS doesn't add its `code` command to the terminal's PATH (the list of folders the terminal searches for commands) by default.

**Fix.** Created the file from the VS Code sidebar instead (right-click the folder, New File). For the future: Cmd + Shift + P, then "Shell Command: Install 'code' command in PATH".

**Lesson.** "command not found" means the terminal doesn't know the program, not that the file or folder is wrong. The earlier `mkdir` in the same command still worked.

## Making the code testable, and a test that was wrong

Adding automated tests needed small changes to the code itself, and one failing test turned out to be a mistake in the test, not the app.

**Symptom.**

- Importing the seed script in a test would have run the whole seed against the database.
- A login test failed: it expected the error message not to mention "email", but the app said "Incorrect email or password."
- The CI workflow file (`.github/workflows/ci.yml`) couldn't be copied onto the Mac; that folder is protected from automated tools.

**Cause.**

- `seed.js` called `main()` at the bottom, so it ran the moment any file loaded it.
- The test checked the wrong thing. The real security rule is that an unknown email and a wrong password get the *same* message, so nobody can use the login form to find out who has an account.
- GitHub workflow files can run code, so they're protected and have to be created by hand.

**Fix.**

1. The seed now only runs when called as a script (`require.main === module`) and exports its merge logic for tests. `npm run db:seed` and `--dry-run` work as before.
2. Rewrote the test to compare the two messages and check they match.
3. Database calls in API tests are replaced with a fake (`jest.mock`), so tests run in about 1 second with no internet or Neon.
4. Created the CI workflow file by hand.

**Lesson.**

- When a test fails, check whether the test is right before changing the app.
- Code that does something when it's loaded is hard to test; put the action behind a function.
- Tests should check the rule ("same message either way"), not the exact wording.

## Contracts card too cramped, and the dashboard scrolled sideways on phones

Adding a "Counting from" header made a narrow card overflow, and a width check while fixing it found a separate overflow on phones.

**Symptom.** With the new header, the column labels ran into each other and wrapped awkwardly. At 1024px wide, the table spilled out of its card. On a 390px phone, the dashboard was 32px wider than the screen.

**Cause.**

- On laptop widths, four cards in a row next to the 250px sidebar left each card about 190px wide, too narrow for a three-column table.
- On phones, the ranked lists reserved a fixed 96px for each value, and grid children in CSS refuse to shrink below their content unless told to (`min-width: 0`).

**Fix.**

1. Shortened the column to "Next 12 mo" (screen readers still hear "Ending within the next 12 months") and kept "12 mo" together on one line.
2. Cards show 2 by 2 until 1200px (the design system's `xl` breakpoint), then 4 in a row.
3. Ranked list values only take the width they need, and chart cards can shrink.
4. Measured page width at 360, 390, 768, 1024, 1200, 1280 and 1440px: no sideways scroll at any size.

Kept "Expired" in full instead of "Exp.", because "Exp." could be read as "expiring", which is the other column.

**Lesson.**

- Check a layout at several widths, not just your own screen.
- Measure overflow in code (compare page width to screen width) instead of trusting your eyes.
- Short labels should still be unambiguous.

## Dashboard still went white after the fix

Two updated files never actually reached the local repository, so the old crash came back even though the fix existed.

**Symptom.** After restarting both servers on the right ports, login worked but the dashboard loaded and then went white again, same as before the fix.

**Cause.** Comparing file fingerprints (md5 checksums) showed the local copy had the dashboard page from before the "don't crash" fix, and the backend service from before the two-date update. The copy step had reported success, but the files were older. It happened again minutes later with a one-line change, so the copy step itself was unreliable: it said "written" without replacing the file. So the frontend asked for `contractStatus`, the backend didn't send it, and the page crashed.

**Fix.**

1. Re-copied both files.
2. Checked every changed file's md5 against the tested version: all four matched.
3. Refreshed; nodemon and Vite reloaded on their own.

From then on, every copied file was checked by checksum before testing.

**Lesson.**

- "Copied" doesn't mean "the right version is there". Verify with a checksum or `git diff`.
- Check every file after copying it, and when a copy doesn't take, edit the file in place instead.
- Defensive frontend code helps, but only once it's actually running.

## "Cannot reach the server" after restarting

Closing the terminals didn't stop the old servers, so the new frontend started on a different port that the backend doesn't accept.

**Symptom.** After closing all terminals and restarting, login showed "Cannot reach the server". The address bar said `localhost:5174` instead of the usual `5173`.

**Cause.** The old Vite process was still holding port 5173, so Vite quietly moved to 5174. The backend's CORS setting (`CLIENT_URL` in `backend/.env`) only allows requests from `http://localhost:5173`, so the browser blocked every call from 5174. The app reports a blocked request the same way as a server that's down.

**Fix.**

1. Stopped anything on the app's ports: `lsof -ti :5001 -ti :5173 -ti :5174 | xargs kill`.
2. Restarted the backend and frontend with `npm run dev` in two terminals, and checked Vite was back on 5173.

**Lesson.**

- Stop servers with Ctrl + C before closing a terminal; closing the window doesn't always stop them.
- Check the port in the address bar. A changed port is a sign an old process is still running.
- "Cannot reach the server" can mean CORS blocked the request, not only that the server is off. The browser console shows a CORS error when that's the case.

## Dashboard went white after the contracts update

The frontend expected a field the backend wasn't sending yet, and React crashed the whole page instead of showing what it could.

**Symptom.** After the new two-date Contracts card was added, the dashboard on localhost loaded for a moment, then the whole page turned white. No error message on screen.

**Cause.** The new card read `stats.contractStatus.dataDate`. The frontend code had updated, but the local backend was still running the old code (started with `npm start`, which doesn't reload on changes). The old backend didn't send `contractStatus`, so the code tried to read a property of `undefined`. In React, an error while drawing a component unmounts the whole app, which is why the page went blank rather than just one card.

**Fix.**

1. Made the dashboard defensive: if `contractStatus` is missing, it shows the older single "Expiring contracts" tile instead of crashing.
2. Removed a second place that read `contractStatus` in a subtitle.
3. Tested both cases with Playwright, faking an old backend by stripping the field from the API response. Both rendered with no page errors.
4. Restarted the backend with `npm run dev` so nodemon reloads it on every change.

**Lesson.**

- Frontend and backend can be out of sync: locally after an edit, and in production while Vercel and Render redeploy at different speeds. The UI should handle a missing field gracefully.
- A white React page almost always means a runtime error while rendering. The browser console (Cmd + Option + J) shows the exact line.
- Run the backend with `npm run dev` during development so it always matches the latest code.

## Earlier challenges in the build

Shorter entries for problems solved earlier, latest first.

| Area | Symptom | Cause | Fix | Lesson |
| --- | --- | --- | --- | --- |
| Data | Contract figures were confusing with a Data date / Today switch | One toggle silently changed two numbers | Replaced it with a card showing both dates side by side, each labelled | Show both views with labels instead of hiding one behind a switch |
| Data | 78 of 90 players had no market value | Source data only valued the 12 detailed players | Kept as empty, labelled "Not in the source data", sorted last, editable; no estimates | Never invent numbers; make gaps visible and fixable |
| Data | Monthly form had months with no year ("August") | Source labels were incomplete | Inferred the year from the season, starting 2024 and moving on when months wrap | Document every assumption you make about the data |
| Data | Two player files overlapped; one retired player; one report pointed at a missing player | Inconsistent source files | Merged into 90 players, skipped the retired one, re-linked the report by name | Clean data once at the seed step, then trust the database |
| Security | The JWT signing secret was exposed outside the `.env` file | Copying from the `.env` file | Rotated the secret and updated it on Render | Never paste anything from a `.env` file anywhere |
| Deployment | API on localhost:5000 returned 403 | macOS AirPlay uses port 5000 | Moved the API to port 5001 | Some ports are taken by the operating system |
| Deployment | Frontend couldn't reach the API | Vite only reads env vars starting with `VITE_`, and the dev server needs a restart after editing .env | Used `VITE_API_URL` and restarted | Each tool has its own env var rules |
| Git | Push to GitHub was rejected | The repo was created on GitHub with a README, so histories didn't match | One-time force push | Create the GitHub repo empty when you already have local code |
| Database | Latest Prisma (v7) was complex and its binaries were blocked | Breaking changes in the new major version | Pinned Prisma 6 | Pick stable, well-documented versions under a deadline |
| Frontend | Charts were blank in automated screenshots | Recharts animations hadn't finished | Turned chart animations off | Test what users see, not just what loads |
| Frontend | Linter flagged state set inside effects | React's newer rules about effects | Rewrote the data hook with a key pattern | Linters catch real bugs early; fix rather than silence them |
