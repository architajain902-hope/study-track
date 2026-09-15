import { useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { dueLabel } from './utils';

let permissionPromise = null;

export function requestNotifPermission() {
  if (!('Notification' in window)) return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  if (!permissionPromise) {
    permissionPromise = Notification.requestPermission();
    permissionPromise.finally(() => { permissionPromise = null; });
  }
  return permissionPromise;
}

export function showBrowserNotif(title, body, url) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(`SatiStudy 🦉 · ${title}`, { body, tag: url });
    n.onclick = () => {
      window.focus();
      if (url) window.location.href = url;
      n.close();
    };
  } catch {
    /* some mobile browsers require a service worker; ignore silently */
  }
}

export function useBrowserNotifications() {
  const { tasks, exams, profile } = useApp();
  const shownRef = useRef(new Set());
  const enabled = profile?.notify_level !== 'none' && requestNotifPermission;

  useEffect(() => {
    if (!enabled) return undefined;
    if (!('Notification' in window)) return undefined;

    const run = () => {
      if (Notification.permission !== 'granted') return;

      // Due today or overdue — browser nudge once per task instance
      const hotTasks = tasks.filter(
        (t) =>
          !t.is_completed &&
          t.due_date &&
          (dueLabel(t.due_date) === 'Due today' || dueLabel(t.due_date).startsWith('Overdue'))
      );

      for (const t of hotTasks) {
        const key = `task-${t.id}-${t.due_date}`;
        if (!shownRef.current.has(key)) {
          shownRef.current.add(key);
          showBrowserNotif('Task due', `${t.title} — ${dueLabel(t.due_date)}`, `/task/${t.id}`);
        }
      }

      for (const e of exams) {
        const diff = Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000);
        if (diff < 0 || diff > 7) continue;
        const key = `exam-${e.id}`;
        if (!shownRef.current.has(key)) {
          shownRef.current.add(key);
          showBrowserNotif('Exam upcoming', `${e.subject} in ${diff === 0 ? 'today!' : `${diff} day${diff === 1 ? '' : 's'}`}`, `/exam/${e.id}`);
        }
      }
    };

    run();
    const iv = setInterval(run, 60000);
    return () => clearInterval(iv);
  }, [tasks, exams, enabled]);

  return { requestNotifPermission };
}