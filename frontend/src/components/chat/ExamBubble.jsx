import { useNavigate } from 'react-router-dom';
import { formatDay, daysUntil, formatTime, formatFull } from '../../lib/utils';

export default function ExamBubble({ exam, senderName = 'You' }) {
  const navigate = useNavigate();
  const diff = daysUntil(exam.exam_date);
  const soon = diff >= 0 && diff <= 3;
  const today = diff === 0;

  return (
    <div className="flex flex-col items-start animate-pop">
      <span className="mb-1 pl-1 text-[13px] text-[#8696a0]">{senderName}</span>
      <div className={`bubble bubble-in w-full border-l-4 ${soon ? 'border-brand-lighter' : 'border-brand-light'}`}>
        <button type="button" onClick={() => navigate(`/exam/${exam.id}`)} className="block w-full text-left">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light/30 text-[13px]">📝</div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{exam.subject}</p>
              <p className={`text-2xl font-bold ${today ? 'text-brand-lighter' : 'text-white'}`}>
                {diff < 0 ? 'Done!' : diff === 0 ? 'Today' : diff}
                <span className="ml-1 text-sm font-normal text-[#8696a0]">{diff > 0 ? 'days left' : ''}</span>
              </p>
              {exam.notes && <p className="mt-1 whitespace-pre-line text-[13px] text-[#c1ccd1]">{exam.notes}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className={`chip ${soon ? 'bg-brand-light/25 text-brand-lighter' : 'bg-surface-light text-[#aebac1]'}`}>
                  📅 {formatFull(exam.exam_date)}
                </span>
              </div>
            </div>
          </div>
        </button>
        <div className="mt-1 flex items-center justify-end">
          <span className="text-[11px] text-[#8696a0]">{formatTime(exam.created_at)}</span>
        </div>
      </div>
    </div>
  );
}