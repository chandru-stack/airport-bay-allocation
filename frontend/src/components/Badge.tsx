const tones = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  ON_TIME: "bg-sky-50 text-sky-700 border-sky-200",
  DELAYED: "bg-amber-50 text-amber-700 border-amber-200",
  ARRIVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DEPARTED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  PENDING: "bg-slate-50 text-slate-700 border-slate-200",
  P0: "bg-purple-50 text-purple-700 border-purple-200",
  P1: "bg-rose-50 text-rose-700 border-rose-200",
  P2: "bg-orange-50 text-orange-700 border-orange-200",
  P3: "bg-amber-50 text-amber-700 border-amber-200",
  P4: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function Badge({ children, tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${tones[tone] || tones.PENDING}`}>
      {children}
    </span>
  );
}
