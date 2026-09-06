import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-ink-900 bg-ink-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h2 className="text-base font-extrabold text-ink-900">CasePilot</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-600">
              An independent civic cyber incident triage and statutory routing service. Designed to eliminate delay during the Golden Hour of financial fraud and provide unambiguous statutory case milestones.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink-900">Official Emergency Contacts</h2>
            <ul className="mt-2 space-y-1.5 text-xs text-ink-700">
              <li>
                National Cyber Helpline:{" "}
                <a className="font-bold text-danger-600 underline" href="tel:1930">
                  1930
                </a>
              </li>
              <li>
                National Emergency Police:{" "}
                <a className="font-bold text-danger-600 underline" href="tel:112">
                  112
                </a>
              </li>
              <li>
                Central Portal:{" "}
                <a className="font-semibold text-brand-600 underline underline-offset-2" href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer noopener">
                  cybercrime.gov.in
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink-900">Prototype Reference</h2>
            <ul className="mt-2 space-y-1.5 text-xs text-ink-700">
              <li>
                <Link className="underline underline-offset-2 hover:text-ink-900" href="/about">
                  What is real vs simulated
                </Link>
              </li>
              <li>
                <Link className="underline underline-offset-2 hover:text-ink-900" href="/compare">
                  Architecture comparison
                </Link>
              </li>
              <li>
                <Link className="underline underline-offset-2 hover:text-ink-900" href="/digital-arrest">
                  Digital arrest emergency guide
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-ink-200 pt-6 text-xs leading-relaxed text-ink-500">
          Independent civic prototype created for the “Build What Moves India” hackathon. Not an official Government of India service and carries no government endorsement. No government production database was accessed or altered. All demonstrative names, phone numbers, and case references are synthetic data.
        </p>
      </div>
    </footer>
  );
}
