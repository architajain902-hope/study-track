import AppHeader from './AppHeader';
import BottomNav from './BottomNav';

export default function PageShell({ title, subtitle, children, headerExtra }) {
  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col bg-ink">
      <AppHeader title={title} subtitle={subtitle} />
      {headerExtra}
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}