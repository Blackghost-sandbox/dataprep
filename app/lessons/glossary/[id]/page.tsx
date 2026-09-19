import Link from "next/link";
import { notFound } from "next/navigation";
import { glossary, getGlossaryItem } from "@/lib/glossary";
import { GlossaryDetails, GlossaryText } from "@/components/glossary";

export function generateStaticParams() { return glossary.map(item => ({ id: item.id })); }
export default async function GlossaryLesson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getGlossaryItem(id);
  if (!item || item.id !== id) notFound();
  return <main className="mx-auto max-w-3xl px-8 py-12"><Link href="/" className="text-sm font-semibold text-[#6d5df6]">← Back to DataPrep</Link><article className="mt-7 rounded-3xl border border-[#e7ecf3] bg-white p-10 shadow-sm"><p className="glossary-eyebrow">{item.category} / CONCEPT LESSON</p><h1 className="text-4xl font-bold tracking-tight">{item.term}</h1>{item.expanded && <p className="mt-2 text-slate-500">{item.expanded}</p>}<p className="my-6 text-lg leading-8 text-slate-600"><GlossaryText>{item.definition}</GlossaryText></p><GlossaryDetails item={item}/></article></main>;
}
