import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-600">Honesty</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">What is real and what is not</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-600">
          Judging this fairly needs a clear line between what genuinely works and what is staged. Here it is.
        </p>
      </div>

      <div className="mb-8">
        <Card variant="danger">
          <p className="mb-1 text-sm font-bold text-danger-700">This is not a government service</p>
          <div className="text-sm leading-relaxed text-ink-700">
            Surakhsa is an independent prototype built for the “Build What Moves India” hackathon. It is not affiliated with, endorsed by, or connected to the Ministry of Home Affairs, I4C, or any government body. It uses no government logo or emblem. If you need to report a real cyber crime, call 1930 or use cybercrime.gov.in.
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="success">Works today</Badge>
        </div>
        <ul className="space-y-2">
          <li className="flex gap-2 text-sm leading-relaxed text-ink-700">
            <span aria-hidden="true" className="mt-0.5 text-success-500">✓</span>
            The whole citizen journey: describe → classify → freeze request → details → review → file → track.
          </li>
          <li className="flex gap-2 text-sm leading-relaxed text-ink-700">
            <span aria-hidden="true" className="mt-0.5 text-success-500">✓</span>
            Free-text classification into 30 official-style categories.
          </li>
          <li className="flex gap-2 text-sm leading-relaxed text-ink-700">
            <span aria-hidden="true" className="mt-0.5 text-success-500">✓</span>
            Offline-first architecture and resilient case delivery queuing.
          </li>
        </ul>
      </Card>

      <Card className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="warning">Simulated</Badge>
        </div>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-bold text-ink-900">Bank and payment network responses</dt>
            <dd className="text-sm leading-relaxed text-ink-600">The freeze request's acknowledgements are generated on a timer inside the browser. Nothing is sent anywhere.</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-ink-900">Identity</dt>
            <dd className="text-sm leading-relaxed text-ink-600">The one-time password is generated on the server and printed on the screen. No SMS is sent.</dd>
          </div>
        </dl>
      </Card>
      
      <Card>
        <h2 className="mb-3 text-lg font-bold text-ink-900">What we did not do</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-ink-700">
          <li>No government system was accessed, tested, probed or integrated with.</li>
          <li>No personal data is collected, transmitted or stored on any server.</li>
        </ul>
      </Card>
    </div>
  );
}
