# Interactive glossary

The root layout mounts `GlossaryProvider` once. All definitions, diagrams, interview questions, mistakes, aliases, and related concepts live in `lib/glossary.ts`.

## Lesson text

```tsx
import { GlossaryText, GlossaryTerm } from "@/components/glossary";

<p>
  <GlossaryText>
    Spark represents computation as a DAG. RDD and DataFrame workloads can require a Shuffle.
  </GlossaryText>
</p>

<p><GlossaryTerm term="rdd">RDDs</GlossaryTerm> support custom transformations.</p>
```

`GlossaryText` accepts plain text, preserves punctuation and spacing, matches longer phrases before shorter aliases, and avoids matching inside identifiers. SQL words SELECT, FROM, and WHERE require uppercase to avoid highlighting ordinary prose. Code and inputs are never automatically rewritten. Do not nest glossary terms inside buttons, links, or other interactive controls.

Hover or keyboard focus previews a term. Click, Enter, or Space opens its drawer. Escape dismisses the preview or drawer. The drawer traps focus and restores focus to the originating term. Related concepts replace the current drawer entry. Reduced-motion preferences disable entry movement.

Full lesson links resolve to `/lessons/glossary/[id]`, generated from the same glossary source. These concept lessons contain the definition, interview explanation, flow diagram, questions, mistakes, and related concepts.

Interview frequencies are editorial demo estimates, visibly labeled in previews. Replace with sourced metrics before representing them as measured interview statistics.

Validation: TypeScript and data/parser assertions pass. Production build was attempted but this environment blocks Next.js child processes with `spawn EPERM`; run `npm.cmd run build` in standalone PowerShell.
