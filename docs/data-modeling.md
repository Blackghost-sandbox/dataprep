# Data Modeling module

## Scope and reuse

The existing module was a disabled roadmap entry with no curriculum or lesson renderer. It now opens 14 ordered lessons, from introduction through interview review. No dependencies or backend services were added.

The implementation extends `SparkLessonPanel` for all seven tabs. It reuses `Sidebar`, `Hero`, `LessonTabs`, the progress/sidebar/footer controls, `SqlSampleTable`, `DarkCodeCard`, `WalkthroughControls`, `GlossaryText` and the existing accordion, quiz and notes implementations. Modeling-specific views live in `components/modeling-visuals.tsx`; curriculum and sample data live in `lib/data-modeling.ts`.

All lessons include concept teaching, worked examples, a checked design-choice exercise with saved written reasoning, two interview questions, two mistakes and two quiz questions. The existing glossary gained 13 modeling terms. Existing notes, quizzes, drafts and completion are isolated under the `modeling` storage namespace; SQL/Spark storage keys remain unchanged.

Visuals cover entity/attribute relationships, key highlights, cardinality switching, interactive ER nodes, normalization stages, a denormalized read model, OLTP/OLAP workloads, a selectable cross-shaped star schema, star/snowflake switching, Type 1/2 history with date-boundary inspection, and business-question-to-dimension mapping. Walkthrough navigation uses content-sized overlapping frames so controls do not move at each step. Hidden frames are inert and excluded from accessibility navigation.

No simulated SQL execution or AI grading is claimed. Worked SQL is labeled illustrative; written reasoning and completion remain self-reported. No new interview statistics were added. Nila was not redesigned or extended in this task.

## Verification results

- TypeScript: passed.
- New modeling files and glossary data targeted lint: passed.
- `node scripts/check-data-modeling.mjs`: 98 tab server renders (hydrated branch fixture), glossary coverage, sidebar progress, all sample table shapes, primary/foreign-key behavior, revenue/order totals and Type 2 interval boundaries passed.
- SQL Fundamentals data and render regression checks: passed.
- Spark SQL regression checks: passed.
- Local development server returned HTTP 200.
- Full repository lint still reports 13 existing errors and 3 warnings in older components/scripts, including effect state updates and CommonJS test imports. They were not broadly refactored.
- Production build attempted; Windows sandbox returned `spawn EPERM` before compilation completed.
- Live browser automation failed to initialize with a missing kernel-assets path. Responsive behavior, keyboard flow and browser persistence therefore remain unverified in a live browser; server render tests do not prove those interactions.

## Manual smoke check

Refresh localhost:3000, select Data Modeling in the roadmap, and verify:

1. Next/Previous and the 14-item lesson playlist, including disabled boundaries.
2. Relationship/cardinality selectors, star nodes and the SCD February 1 boundary.
3. Walkthrough Next/Back/Restart and user-started Auto-play/Pause.
4. Hands-on selection feedback, rationale persistence, quiz submission/retry, and lesson notes after reload.
5. Mark/unmark completion and isolated progress when switching SQL → Modeling → Spark.
6. Glossary hover, keyboard focus, Enter deep dive and Escape dismissal.
7. 1280px, 1440px, 1536px and narrow layouts; horizontal scrolling stays inside wide tables.

## Content references

- [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Kimball dimensional design process](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/four-4-step-design-process/)
- [Kimball Type 2 dimensions](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/)
- [Microsoft Learn star-schema guidance](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)

The retail records, exercises and diagrams are original instructional examples, not company/interview statistics.
