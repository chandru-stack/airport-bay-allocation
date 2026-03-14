import Button from "./Button";

export default function Modal({ open, title, onClose, children, footer, size = "md" }) {
  if (!open) return null;

  const sizeMap = {
    sm: "max-w-lg",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
  };

  const modalWidth = sizeMap[size] || sizeMap.md;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full ${modalWidth} rounded-2xl border border-blue-100 bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="text-lg font-semibold">{title}</div>
          <Button variant="ghost" onClick={onClose} className="px-3 py-2">✕</Button>
        </div>

        {/* Scrollable content area */}
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
