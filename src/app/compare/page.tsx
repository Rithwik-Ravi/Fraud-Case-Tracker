import Card from "@/components/ui/Card";
import Link from "next/link";

export default function Compare() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Before and After</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-600">
          A side-by-side comparison of the current National Cyber Crime Reporting Portal and this conceptual redesign.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-bold text-ink-900">Current Portal</h2>
          <Card className="h-full bg-ink-50">
            <p className="text-sm text-ink-600">
              The existing portal requires users to self-classify their cases, often using legal jargon and complex dropdown menus. It demands upfront evidence upload before collecting actionable details like suspect bank accounts.
            </p>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-bold text-ink-900">Surakhsa Redesign</h2>
          <Card className="h-full border-brand-200">
            <p className="text-sm text-ink-600">
              The redesign focuses on plain language, automatic triage, and prioritizing the "golden hour" for financial fraud. It asks one question at a time and provides accessible, readable interfaces.
            </p>
          </Card>
        </div>
      </div>
      
      <div className="mt-8">
        <Link className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700" href="/">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
