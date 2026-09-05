/**
 * Timeline and SLA helper utilities
 * Stages reflect MHA / I4C official case progression, updated April 2026
 * to include the Money Restoration Module (MRM).
 */

export function getStageName(stage: number, freezeRequested = false): string {
  switch (stage) {
    case 1:
      return "Complaint Formalized";
    case 2:
      return freezeRequested
        ? "Banking Network Freeze Hold (1930 / CFCFRMS)"
        : "Preliminary Intake Review";
    case 3:
      return "Investigating Officer (IO) Allocated";
    case 4:
      return "Notice under Section 91 CrPC & Evidence Collection";
    case 5:
      return "Final Determination & Settlement";
    case 6:
      return "Money Restoration Module (MRM) Review";
    case 7:
      return "Funds Restored to Victim Account";
    default:
      return `Stage ${stage} Processing`;
  }
}

/**
 * Returns the official SLA detail line naming the stage explicitly as a stage.
 */
export function getSlaDetailLine(stage: number, freezeRequested = false): string {
  return `Stage ${stage}: ${getStageName(stage, freezeRequested)}`;
}

/**
 * Formats the time gap/duration between two events.
 * A gap between two events is always a duration (e.g., "14 days", "2 hours", "30 minutes")
 * and NEVER reads as an absolute point in time (e.g. calendar date or clock time).
 */
export function formatEventGap(
  startDate: Date | string | number,
  endDate: Date | string | number = Date.now()
): string {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffMs = Math.abs(end - start);

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  if (hours > 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  return `${Math.max(1, seconds)} seconds`;
}
