import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h2 className="text-sm font-bold text-ink-900">Surakhsa</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              A concept redesign of India's National Cyber Crime Reporting Portal, built on the{" "}
              <a className="font-medium text-brand-600 underline underline-offset-2" href="https://www.ux4g.gov.in/" target="_blank" rel="noreferrer noopener">
                UX4G design system
              </a>.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink-900">In a real emergency</h2>
            <ul className="mt-2 space-y-1 text-sm text-ink-600">
              <li>
                Cyber crime helpline:{" "}
                <a className="font-semibold text-danger-600" href="tel:1930">
                  1930
                </a>
              </li>
              <li>
                Police:{" "}
                <a className="font-semibold text-danger-600" href="tel:112">
                  112
                </a>
              </li>
              <li>
                Official portal:{" "}
                <a className="font-medium text-brand-600 underline underline-offset-2" href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer noopener">
                  cybercrime.gov.in
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink-900">About this build</h2>
            <ul className="mt-2 space-y-1 text-sm text-ink-600">
              <li>
                <Link className="underline underline-offset-2" href="/about">
                  What works and what is mocked
                </Link>
              </li>
              <li>
                <Link className="underline underline-offset-2" href="/compare">
                  Before and after
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-ink-200 pt-6 text-xs leading-relaxed text-ink-500">
          This is an independent prototype created for the “Build What Moves India” hackathon. It is not an official Government of India service and carries no government endorsement. No government system was accessed, tested or integrated with. Every case, name, amount and identifier shown is synthetic test data.
        </p>
      </div>
    </footer>
  );
}
