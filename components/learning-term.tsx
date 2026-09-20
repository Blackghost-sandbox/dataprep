"use client";

import { GlossaryTerm } from "@/components/glossary";
import { SimpleExplanation, simpleExplanations } from "@/components/simple-explanation";
import { getGlossaryItem } from "@/lib/glossary";

/** Shared lesson renderer: brief beginner explanations or a full glossary deep dive. */
export function LearningTerm({ term, label = term, deepDive = false }: { term: string; label?: string; deepDive?: boolean }) {
  if (getGlossaryItem(term) && (deepDive || !simpleExplanations[term])) {
    return <GlossaryTerm term={term}>{label}</GlossaryTerm>;
  }
  return <SimpleExplanation label={term} displayText={label}/>;
}
