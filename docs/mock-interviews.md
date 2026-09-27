# Mock interview module

Nine rounds reuse the existing course interview questions and model answers: SQL, Modeling, Spark, Airflow, Kafka, dbt, Cloud, System Design and a mixed Data Engineer round. There are 40 question placements. Topic rounds have four questions and a suggested 20-minute timer; the mixed round has eight questions and 40 minutes.

The existing roadmap, header, navigation, progress and deep-link parser are reused. Mock rounds use a dedicated session interface rather than irrelevant concept/code lesson tabs. Each session supports practice/timed mode, pause/resume, written/code drafts, follow-ups, review rubrics, reflections, downloadable text review and the last ten score summaries. Model answers are hidden during timed attempts. Practice reveals are marked assisted. A score is explicitly a self-assessment, not AI grading or a hiring prediction.

State is browser-local under `dataprep.mock.session.v1.<round-id>`. Returning to an active attempt restores it paused; time away is not charged. Browser storage failure displays a warning. Only the current attempt retains full drafts; prior history retains summaries. Roadmap completion remains explicitly self-reported and separate from review history.

## Verification

- `node scripts/check-mock-interviews.mjs`: nine rounds, question completeness, 45 server-rendered phase fixtures, timed answer gating, deep-link round trips, timer expiry/pause, malformed-state handling, score calculations and history limits.
- TypeScript and targeted component/data lint pass.
- PR module, Airflow, SQL and Spark SQL regression checks pass.
- Production build attempted but blocked by environment `spawn EPERM`.

Server-render tests do not prove browser event handling, storage availability, downloads or responsive layouts. Manual check: select Mock Interviews, start both modes, write answers, navigate questions, pause/resume, refresh, allow the timer to expire, review/rate every criterion, save/download, retry and verify history. Confirm existing course modules still navigate correctly. No real audio capture, AI evaluator or remote interviewer is connected.
