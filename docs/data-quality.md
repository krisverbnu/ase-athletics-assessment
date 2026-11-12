# Data quality notes

The assessment data is real football data with real gaps. ASE confirmed that handling missing data is part of the challenge, so this file records every issue found, what the app does about it, and why.

**Guiding rule:** never invent a number. A missing value is shown as missing, explained, and can be filled in by a scout. It is never shown as zero or silently estimated.

## Snapshot

| Field | Players with data | Coverage |
|---|---|---|
| Attribute ratings | 90 / 90 | 100% |
| Contract end date | 90 / 90 | 100% |
| Salary | 90 / 90 | 100% |
| Market value | 12 / 90 | 13% |
| Value history (2+ points) | 12 / 90 | 13% |
| Month-by-month form | 12 / 90 | 13% |

The same numbers are calculated live by the API (`GET /api/dashboard/stats` → `dataQuality`) and shown in the **Data quality** panel at the bottom of the dashboard, so they stay correct when players are added or edited.

## Issues and decisions

| # | Issue | Evidence | Decision | Why |
|---|---|---|---|---|
| 1 | Two player files describe overlapping players | `players_Data_production.json` has 79 players, `player_statistics_detailed.json` has 13 (one also in the main file, one retired) | Merged into one `players` table: 79 + 11 new = **90**. Alessandro Rodriguez exists in both, so his main record is enriched with the detailed fields | One source of truth; no duplicate players in search or charts |
| 2 | Market value missing for most players | Only the 12 players from the detailed file have a value | Stored as `NULL`, shown as "Not available" with the note "Not in the source data · add it", sorted last. Scouts can add it on the edit form | 12 values are too few to model the other 78 honestly. A guess shown next to real figures would look like data |
| 3 | Value history and monthly form only exist for 12 players | Same 12 detailed players | Charts only include players with history; empty states explain why a chart is blank | Avoids flat or fake lines |
| 4 | Salary has no unit | Field is a bare number | Treated as **weekly, in EUR**, labelled in the profile and the form | Matches the scale of the detailed file and how European football reports wages |
| 5 | The data is a snapshot, not live | Latest date in the files is 8 Jul 2025 | The contracts card shows expired and ending-within-12-months counts **from the data date and from today, side by side**, each labelled with its date. The "Contracts ending soon" list uses the data date | Measured only from today, many contracts look expired, which hides who was actually ending at the time of the data. Measured only from the data date, a scout today would be misled. Showing both, labelled, avoids either mistake |
| 6 | A retired player in the detailed file | Batalla marked as retired | Not imported | The app scouts active players; a retired profile would skew ages and values |
| 7 | Scout report linked to a player id that doesn't exist | Report #1 points to a missing id | Re-linked by name to Marcus Thompson | Keeps the report instead of dropping real scouting work |
| 8 | Monthly form labels without a year | e.g. "August", "September" | Year inferred: starts in 2024 and increments when months wrap (Dec → Jan) | Matches the 2024-25 season the data covers |
| 9 | ASE's reports have no SIGN / MONITOR / PASS verdict | The file's `recommendation` field is a sentence ("Exceptional young talent...") | On import, that sentence becomes the report's **summary**, and the verdict comes from the overall rating: **9–10 SIGN, 6–8 MONITOR, 1–5 PASS**. New reports: the scout chooses the verdict | Keeps the scout's words and gives every report a verdict the app can filter and colour. One rule, applied once, documented and tested |
| 10 | Design system button colour fails contrast | `#0ea5e9` on white text is below WCAG AA | Buttons use the darker `#0369a1` from the same palette | Accessibility without leaving the brand |

## What a scout sees

- **Players table:** missing values show "n/a" with a tooltip, "Not provided in the source data".
- **Player profile:** each value says where it came from: *ASE detailed data*, *Entered in this app*, or *Not in the source data · add it*.
- **Edit form:** hints say salary is weekly in euros, and that an unknown market value should stay empty, never 0.
- **Dashboard:** the Data quality panel shows coverage and links back to this file.

## What I'd do with more time

- Import market values from a licensed provider and record the source and date per value.
- Ask ASE to confirm the salary unit.
- Add a "last verified" date per player so stale data is visible.
