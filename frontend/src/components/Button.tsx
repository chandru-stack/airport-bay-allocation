export default function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold " +
    "shadow-sm transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";

  const map = {
    // White + Blue (AAI-style) palette
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300",
    secondary:
      "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200",
    ghost:
      "bg-transparent text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };

  return <button className={`${base} ${map[variant] || map.primary} ${className}`} {...props} />;
}
