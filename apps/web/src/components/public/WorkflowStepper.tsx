const STAGES = [
  {
    label: "Pilih Jenis Surat",
    desc: "Tentukan surat keterangan yang Anda perlukan dari daftar yang tersedia.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m-8 5h10a2 2 0 0 0 2-2V7.414a1 1 0 0 0-.293-.707l-3.414-3.414A1 1 0 0 0 14.586 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z"
      />
    ),
  },
  {
    label: "Isi Data",
    desc: "Lengkapi formulir sesuai data diri Anda, langkah demi langkah.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487 18.55 2.8a1.987 1.987 0 1 1 2.81 2.81l-1.688 1.688m-2.81-2.81-9.9 9.9a2 2 0 0 0-.523.906l-1.05 3.65a.5.5 0 0 0 .618.619l3.65-1.05a2 2 0 0 0 .906-.524l9.9-9.9m-2.81-2.81 2.81 2.81M8 20h9"
      />
    ),
  },
  {
    label: "Submit",
    desc: "Kirim permohonan dan dapatkan nomor unik untuk pelacakan.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z"
      />
    ),
  },
  {
    label: "Pantau Status",
    desc: "Cek progres kapan saja lewat website atau chatbot WhatsApp.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
];

/** Alur pakai layanan dari sudut pandang warga, ditampilkan di landing page - bukan alur kerja internal perangkat desa. */
export function WorkflowStepper() {
  return (
    <ol className="flex flex-col gap-6 md:flex-row md:items-start md:gap-0">
      {STAGES.map((stage, i) => (
        <li key={stage.label} className="flex md:flex-1 md:flex-col md:items-center">
          <div className="flex items-center self-stretch md:w-full md:self-auto">
            <div className={`hidden h-px flex-1 bg-border md:block ${i === 0 ? "md:invisible" : ""}`} aria-hidden="true" />
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-cardinal text-cardinal"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                {stage.icon}
              </svg>
            </span>
            <div
              className={`hidden h-px flex-1 bg-border md:block ${i === STAGES.length - 1 ? "md:invisible" : ""}`}
              aria-hidden="true"
            />
          </div>
          <div className="ml-4 md:ml-0 md:mt-3 md:max-w-[11rem] md:text-center">
            <p className="text-xs font-medium text-cardinal">Langkah {i + 1}</p>
            <p className="font-medium text-ink">{stage.label}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{stage.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
