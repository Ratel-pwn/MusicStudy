import type { KeyboardEvent } from 'react';

type FeedbackSheetProps = {
  open: boolean;
  correct: boolean;
  level: 0 | 1 | 2 | 3;
  message?: string;
  onContinue?(): void;
  onDismiss?(): void;
};

export function FeedbackSheet({ open, correct, level, message, onContinue, onDismiss }: FeedbackSheetProps) {
  if (!open) return null;
  const dismiss = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onDismiss?.();
  };

  return (
    <div
      aria-label={correct ? '回答正确' : `需要调整，反馈级别 ${level}`}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl rounded-t-[2.5rem] border-2 border-b-0 border-[#102a43] bg-[#fffaf0] px-6 py-6 shadow-[0_-18px_60px_rgba(11,34,54,.18)]"
      onKeyDown={dismiss}
      role="dialog"
      tabIndex={-1}
    >
      <div className="flex items-center gap-4">
        <span aria-hidden className={`${correct ? 'bg-[#4eaa94]' : 'bg-[#ef765d]'} grid size-10 place-items-center rounded-full font-bold text-white`}>
          {correct ? 'OK' : '!'}
        </span>
        <p className="m-0 flex-1 text-lg font-bold text-[#102a43]">{message ?? (correct ? '听见了，继续保持。' : '再听一次，再调整。')}</p>
        {correct ? (
          <button className="rounded-full bg-[#102a43] px-6 py-3 font-bold text-[#fff4d6]" onClick={onContinue} type="button">继续</button>
        ) : (
          <button className="rounded-full border-2 border-[#102a43] px-6 py-3 font-bold text-[#102a43]" onClick={onDismiss} type="button">再试一次</button>
        )}
      </div>
    </div>
  );
}
