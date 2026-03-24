import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  ScanLine,
  Coins,
} from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'AI Advisor' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/scanner', icon: ScanLine, label: 'Receipt Scanner' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex flex-col z-40">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-text leading-tight">Monify</h1>
            <p className="text-xs text-text-muted">Your Money, Simplified</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary-dark'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4">
          <p className="text-xs font-semibold text-primary-dark mb-1">Powered by AI</p>
          <p className="text-xs text-text-secondary">
            Insights generated with OpenAI
          </p>
        </div>
      </div>
    </aside>
  );
}
