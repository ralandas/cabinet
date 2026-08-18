'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Дашборд', icon: '📊' },
  { href: '/calendar', label: 'Календарь', icon: '📅' },
  { href: '/apartments', label: 'Квартиры', icon: '🏠' },
  { href: '/settings/telegram', label: 'Telegram', icon: '💬', group: 'settings' },
  { href: '/settings/pms', label: 'PMS', icon: '🔗', group: 'settings' },
  { href: '/settings/agent', label: 'Агент', icon: '🤖', group: 'settings' },
  { href: '/settings/profile', label: 'Профиль', icon: '👤', group: 'settings' },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const mainItems = NAV_ITEMS.filter((i) => !i.group);
  const settingsItems = NAV_ITEMS.filter((i) => i.group === 'settings');

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Progon Pro</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {mainItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Настройки</div>
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {(user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || user?.email || 'Пользователь'}</div>
              <div className="user-email">{user?.email || user?.phone || ''}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost btn-sm w-full mt-2">
            Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
