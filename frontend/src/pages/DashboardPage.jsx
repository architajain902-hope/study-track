import { useState } from 'react';
import PageShell from '../components/layout/PageShell';
import ChatFeed from '../components/chat/ChatFeed';
import Composer from '../components/chat/Composer';
import TaskForm from '../components/forms/TaskForm';
import ExamForm from '../components/forms/ExamForm';
import { useApp } from '../store/AppContext';

export default function DashboardPage() {
  const { activeStreak } = useApp();
  const [taskModal, setTaskModal] = useState(null);   // null | { mode: 'quick', title?: '' }
  const [examModal, setExamModal] = useState(false);

  const openTask = (preFill = '') => setTaskModal({ mode: 'quick', title: preFill });
  const openExam = () => setExamModal(true);

  return (
    <PageShell
      title="SatiStudy"
      subtitle={activeStreak > 0 ? `🔥 ${activeStreak}-day streak` : 'Your witty study owl'}
      headerExtra={null}
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <ChatFeed onAddQuick={() => openTask('')} />
        </div>
        <div className="border-t border-surface bg-surface-dark pb-safe">
          <Composer onAddTask={openTask} onAddExam={openExam} />
        </div>
      </div>

      {taskModal && (
        <TaskForm
          onClose={() => setTaskModal(null)}
          initial={taskModal.title ? { title: taskModal.title } : undefined}
        />
      )}
      {examModal && <ExamForm onClose={() => setExamModal(false)} />}
    </PageShell>
  );
}