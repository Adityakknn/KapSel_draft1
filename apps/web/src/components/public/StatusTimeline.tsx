import type { StatusPermohonan } from "shared/types";

type StepState = "done" | "active" | "pending" | "rejected";

interface Step {
  label: string;
  state: StepState;
}

/** Peta status enum (4 nilai riil di DB) ke langkah-langkah visual - beda dari WorkflowStepper yang konseptual/7 tahap di landing. */
function getSteps(status: StatusPermohonan): Step[] {
  if (status === "DITOLAK") {
    return [
      { label: "Diajukan", state: "done" },
      { label: "Ditolak", state: "rejected" },
    ];
  }

  return [
    { label: "Diajukan", state: "done" },
    { label: "Verifikasi", state: status === "MENUNGGU_VERIFIKASI" ? "active" : "done" },
    {
      label: "Diproses",
      state: status === "SELESAI" ? "done" : status === "DISETUJUI" ? "active" : "pending",
    },
    { label: "Selesai", state: status === "SELESAI" ? "done" : "pending" },
  ];
}

const CIRCLE_STYLE: Record<StepState, string> = {
  done: "bg-cardinal border-cardinal text-white",
  active: "border-cardinal text-cardinal bg-white",
  pending: "border-border text-ink-muted bg-white",
  rejected: "bg-cardinal border-cardinal text-white",
};

const LABEL_STYLE: Record<StepState, string> = {
  done: "text-ink font-medium",
  active: "text-cardinal font-medium",
  pending: "text-ink-muted",
  rejected: "text-cardinal font-medium",
};

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (state === "rejected") {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return null;
}

export function StatusTimeline({ status }: { status: StatusPermohonan }) {
  const steps = getSteps(status);

  return (
    <ol className="flex items-start" aria-label="Progres permohonan">
      {steps.map((step, i) => (
        <li key={step.label} className="flex flex-1 flex-col items-center last:flex-none">
          <div className="flex w-full items-center">
            <div
              className={`h-px flex-1 ${i === 0 ? "invisible" : step.state !== "pending" ? "bg-cardinal" : "bg-border"}`}
              aria-hidden="true"
            />
            <span
              aria-current={step.state === "active" ? "step" : undefined}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${CIRCLE_STYLE[step.state]}`}
            >
              <StepIcon state={step.state} />
            </span>
            <div
              className={`h-px flex-1 ${i === steps.length - 1 ? "invisible" : "bg-border"}`}
              aria-hidden="true"
            />
          </div>
          <p className={`mt-2 max-w-[6rem] text-center text-xs ${LABEL_STYLE[step.state]}`}>{step.label}</p>
        </li>
      ))}
    </ol>
  );
}
