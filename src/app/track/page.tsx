"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ReadAloud from "@/components/ui/ReadAloud";
import { trackComplaint, getUserComplaints, SerializedComplaint } from "@/actions/track";
import { useAccount, maskPhone } from "@/context/AccountContext";
import {
  Search,
  FileCheck,
  Building2,
  Clock,
  Landmark,
  ShieldCheck,
  AlertCircle,
  FolderOpen,
  ArrowRight,
} from "lucide-react";

function TrackContent() {
  const searchParams = useSearchParams();
  const initialAck = searchParams.get("ack") || "";
  const { phone } = useAccount();

  const [ackInput, setAckInput] = useState(initialAck);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedComplaint, setSearchedComplaint] = useState<SerializedComplaint | null>(null);

  // User's own complaints
  const [userComplaints, setUserComplaints] = useState<SerializedComplaint[]>([]);
  const [loadingUserComplaints, setLoadingUserComplaints] = useState(false);

  const fetchTrack = async (ack: string) => {
    if (!ack.trim()) return;
    setLoading(true);
    setError("");
    setSearchedComplaint(null);

    try {
      const res = await trackComplaint(ack);
      if (res.error) {
        setError(res.error);
      } else if (res.complaint) {
        setSearchedComplaint(res.complaint);
      }
    } catch {
      setError("Failed to retrieve complaint from MongoDB.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAck) {
      fetchTrack(initialAck);
    }
  }, [initialAck]);

  useEffect(() => {
    async function loadUserComplaints() {
      setLoadingUserComplaints(true);
      try {
        const res = await getUserComplaints();
        if (res.signedIn && res.complaints) {
          setUserComplaints(res.complaints);
        }
      } catch (err) {
        console.error("Load user complaints error:", err);
      } finally {
        setLoadingUserComplaints(false);
      }
    }
    loadUserComplaints();
  }, [phone]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrack(ackInput);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Track a cyber crime complaint
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-600">
          Real-time case progress and SLA milestones retrieved directly from the repository.
        </p>
      </div>

      {/* Search Bar Card */}
      <Card className="p-6">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div>
            <label htmlFor="ack" className="block text-sm font-semibold text-ink-900 mb-1.5">
              Enter Acknowledgement Number
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  id="ack"
                  type="text"
                  value={ackInput}
                  onChange={(e) => setAckInput(e.target.value)}
                  placeholder="e.g. ACK-2026-481902"
                  className="w-full rounded-ux border-2 border-ink-200 px-4 py-3 font-mono text-base text-ink-900 focus:border-brand-500 focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </div>
              <Button type="submit" variant="primary" disabled={loading || !ackInput.trim()} className="py-3 px-6">
                {loading ? (
                  "Checking..."
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Track Status</span>
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-ink-500">
              An acknowledgement number works from anywhere without signing in.
            </p>
          </div>

          {error && (
            <div className="rounded-ux bg-danger-50 p-3 text-sm font-medium text-danger-700 border border-danger-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </Card>

      {/* Search Result Display */}
      {searchedComplaint && (
        <div className="space-y-6">
          <Card className="p-6">
            {/* Header / Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-200 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  Acknowledgement Number
                </p>
                <p className="font-mono text-2xl font-extrabold text-ink-900 mt-0.5">
                  {searchedComplaint.ack}
                </p>
                <p className="text-xs text-ink-500 mt-1">
                  Filed on {new Date(searchedComplaint.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={searchedComplaint.urgency === "golden-hour" ? "danger" : "brand"}>
                  {searchedComplaint.categoryLabel}
                </Badge>
                {searchedComplaint.freezeRequested && (
                  <Badge tone="warning">Bank Freeze Dispatched</Badge>
                )}
              </div>
            </div>

            {/* Statutory SLA Banner */}
            <div className="mt-5 rounded-ux border border-brand-200 bg-brand-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-brand-900">
              <div>
                <strong className="block font-semibold">Right to Service Act Standard Timeline</strong>
                <span>Assigned Node: {searchedComplaint.policeUnitAssigned || "State Cyber Cell (HQ)"}</span>
              </div>
              <span className="font-semibold whitespace-nowrap bg-white px-2.5 py-1 rounded-ux border border-brand-200">
                ⏱ {searchedComplaint.daysRemainingInSla ?? 14} days remaining in SLA
              </span>
            </div>

            {/* Timeline Stages */}
            <div className="mt-8 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-900">
                Official Case Progression
              </h2>

              <div className="relative border-l-2 border-ink-200 ml-4 pl-6 space-y-8">
                {/* Stage 1 */}
                <div className="relative">
                  <div className="absolute -left-[35px] grid h-7 w-7 place-items-center rounded-full bg-success-500 text-white shadow-sm">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-900">1. Complaint Formalized</h3>
                    <p className="text-xs text-ink-600 mt-0.5">
                      Securely recorded in repository with digital timestamp and hash verification.
                    </p>
                  </div>
                </div>

                {/* Stage 2: Freeze Request (if applicable) */}
                {searchedComplaint.freezeRequested && (
                  <div className="relative">
                    <div className={`absolute -left-[35px] grid h-7 w-7 place-items-center rounded-full ${
                      searchedComplaint.stage >= 2 ? "bg-success-500 text-white" : "bg-warning-500 text-white"
                    } shadow-sm`}>
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-ink-900">
                        2. Banking Network Freeze Hold (1930 / CFCFRMS)
                      </h3>
                      <p className="text-xs text-ink-600 mt-0.5">
                        {searchedComplaint.bankName ? `Notice delivered to ${searchedComplaint.bankName}. ` : "Notice delivered to beneficiary payment switch. "}
                        Mule account lien hold requested for {searchedComplaint.amount ? `₹${Number(searchedComplaint.amount).toLocaleString("en-IN")}` : "reported amount"}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Stage 3: IO Assignment */}
                <div className="relative">
                  <div className={`absolute -left-[35px] grid h-7 w-7 place-items-center rounded-full ${
                    searchedComplaint.stage >= 3 ? "bg-success-500 text-white" : "bg-brand-500 text-white"
                  } shadow-sm`}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-900">
                      {searchedComplaint.freezeRequested ? "3. Investigating Officer (IO) Allocated" : "2. Investigating Officer (IO) Allocated"}
                    </h3>
                    <p className="text-xs text-ink-600 mt-0.5">
                      Assigned to District Cyber Cell. Notice generated under Section 91 CrPC for digital logs and CDR analysis.
                    </p>
                  </div>
                </div>

                {/* Stage 4: Resolution */}
                <div className="relative">
                  <div className={`absolute -left-[35px] grid h-7 w-7 place-items-center rounded-full ${
                    searchedComplaint.stage >= 5 ? "bg-success-500 text-white" : "bg-ink-200 text-ink-600"
                  } shadow-sm`}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink-900">Final Determination & Settlement</h3>
                    <p className="text-xs text-ink-600 mt-0.5">
                      Court charge-sheet submission or recovery release order under magistrate jurisdiction.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative Summary */}
            <div className="mt-8 border-t border-ink-200 pt-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                Citizen Narrative On Record
              </p>
              <div className="rounded-ux bg-ink-50 p-4 text-sm leading-relaxed text-ink-800">
                {searchedComplaint.narrative}
              </div>
              <ReadAloud text={searchedComplaint.narrative} />
            </div>

            {/* Evidence items */}
            {searchedComplaint.evidenceFiles && searchedComplaint.evidenceFiles.length > 0 && (
              <div className="mt-6 border-t border-ink-200 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                  Verified Evidence Attachments ({searchedComplaint.evidenceFiles.length})
                </p>
                <div className="space-y-1.5 text-xs text-ink-700">
                  {searchedComplaint.evidenceFiles.map((f, i) => (
                    <div key={i} className="flex justify-between items-center rounded-ux border border-ink-200 p-2 bg-white">
                      <span className="font-semibold">{f.name}</span>
                      <span className="font-mono text-[10px] text-ink-500">{f.sha256.slice(0, 16)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Citizen Account Complaints Section */}
      <div className="border-t border-ink-200 pt-8">
        {phone ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink-900">Your Filed Complaints</h2>
                <p className="text-xs text-ink-500">
                  Complaints filed under your verified mobile number ({maskPhone(phone)})
                </p>
              </div>
              <Badge tone="success">Verified Account</Badge>
            </div>

            {loadingUserComplaints ? (
              <p className="text-sm text-ink-500 animate-pulse">Loading complaints from MongoDB...</p>
            ) : userComplaints.length === 0 ? (
              <div className="rounded-ux-lg border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500 bg-ink-50/50">
                No previous complaints found for {maskPhone(phone)}. Complaints you file while signed in will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {userComplaints.map((c) => (
                  <div
                    key={c.ack}
                    onClick={() => {
                      setAckInput(c.ack);
                      fetchTrack(c.ack);
                    }}
                    className="block rounded-ux-lg border border-ink-200 bg-white p-4 transition hover:border-brand-500 hover:shadow-sm cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold text-ink-900">{c.ack}</span>
                      <Badge tone={c.urgency === "golden-hour" ? "danger" : "brand"}>
                        {c.categoryLabel}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-ink-600 mt-2">{c.narrative}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
                      <span>Filed: {new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
                      <span className="text-brand-600 font-semibold flex items-center gap-1">
                        View Details <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-ux-lg border border-ink-200 bg-ink-50 p-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-ink-900">Want to see all your complaints in one place?</h2>
              <p className="text-sm text-ink-600 mt-1">
                An acknowledgement number works from anywhere without signing in. Signing in gets you the whole list across devices.
              </p>
            </div>
            <Link
              href="/signin?next=/track"
              className="whitespace-nowrap rounded-ux bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition shrink-0 inline-block text-center"
            >
              Citizen Sign In →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-ink-500">Loading tracking dashboard...</div>}>
      <TrackContent />
    </Suspense>
  );
}
