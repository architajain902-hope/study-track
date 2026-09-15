import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ children, onClose, title }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="glass-overlay fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="glass-panel relative w-full max-w-lg rounded-t-2xl px-4 pb-4 pt-3 shadow-2xl animate-pop sm:rounded-2xl max-h-[90vh] overflow-y-auto ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 px-1 pb-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted backdrop-blur hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}