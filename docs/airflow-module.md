# Apache Airflow module

16 lessons reuse the existing lesson shell, tabs, progress, notes, glossary/deep dives, code console, interviews, mistakes and quizzes. The previously disabled Airflow roadmap entry now opens the module. Storage uses the independent `dataprep.airflow` namespace.

## Baseline and scope

Airflow 3.1 Task SDK (`airflow.sdk`); examples distinguish complete teaching DAGs from fragments. Interval examples explicitly select `CronDataIntervalTimetable` and UTC. No real scheduler, Python runtime, warehouse, storage or grading service is connected to the website. Graphs are deterministic educational traces; sibling execution order is illustrative. Mapped graph boxes stand for map-indexed instances, not separate task definitions. Example outputs describe actual teaching effects, including no-op warehouse placeholders.

References: [TaskFlow](https://airflow.apache.org/docs/apache-airflow/3.1.0/tutorial/taskflow.html), [public interfaces](https://airflow.apache.org/docs/apache-airflow/3.1.0/public-airflow-interface.html), [timetables](https://airflow.apache.org/docs/apache-airflow/3.1.0/authoring-and-scheduling/timetable.html), [deferring](https://airflow.apache.org/docs/apache-airflow/3.1.0/authoring-and-scheduling/deferring.html). Each lesson links its relevant official reference.

## Automated verification

- `node scripts/check-airflow.mjs`: 16 lessons × 7 hydrated-branch server renders, sidebar, quiz answer indices, seven execution graphs, dependency eligibility, branch trigger rules, retry success/exhaustion, sensor rescheduling.
- Python AST parsing: all 16 example snippets pass syntax checks; does not validate imports against an installed Airflow deployment.
- TypeScript no-emit and targeted lint for new files pass.
- Existing Modeling, SQL render and Spark SQL checks pass.
- Production build attempted: environment prevents worker creation (`spawn EPERM`). No successful production-build claim.

## Remaining manual QA

Live browser QA was not available in this environment. Verify 1280/1440/1536 desktop widths; Airflow sidebar navigation; every tab; glossary hover, keyboard and drawer escape; graph inspection; Next/Back/Restart/Auto-play; retry-outcome switching; quiz submit/retry; code copy; completion and per-lesson notes/drafts after reload. The server-render fixture intentionally hydrates the content branch only for render coverage, not persistence testing. Run teaching DAGs only in a separately configured compatible Airflow environment. Configure required Variables/Connections and check provider compatibility first.
