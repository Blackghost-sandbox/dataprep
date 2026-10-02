import type { Metadata } from "next";
import "./globals.css";
import "./glossary.css";
import "./examples.css";
import "./challenge.css";
import "./interview.css";
import "./mistakes.css";
import "./spark-lessons.css";
import "./spark-topic-visuals.css";
import "./rdd-experience.css";
import "./sql-fundamentals.css";
import "./companion.css";
import "./data-modeling.css";
import "./airflow.css";
import "./kafka.css";
import "./mock-interview.css";
import "./where-lab.css";
import "./spark-performance.css";
import "./spark-transformations.css";
import "./spark-partitioning.css";
import "./kafka-intro.css";
import "./airflow-lab.css";
import "./python-summary.css";
import "./python-quiz.css";
import "./python-introduction.css";
import "./python-data-structures.css";
import "./python-functions-modules.css";
import "./python-files-formats.css";
import "./python-error-handling.css";
import { GlossaryProvider } from "@/components/glossary";

export const metadata: Metadata = {
  title: "DataPrep — Data Engineering Interview Preparation",
  description: "Learn, practice, and prepare for data engineering interviews.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><GlossaryProvider>{children}</GlossaryProvider></body>
    </html>
  );
}
