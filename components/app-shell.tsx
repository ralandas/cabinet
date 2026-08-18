'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '@/components/icon';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Дашборд', icon: 'dashboard' },
  { href: '/calendar', label: 'Календарь', icon: 'calendar' },
  { href: '/apartments', label: 'Квартиры', icon: 'home' },
  { href: '/settings/telegram', label: 'Telegram', icon: 'message', group: 'settings' },
  { href: '/settings/pms', label: 'PMS', icon: 'plug', group: 'settings' },
  { href: '/settings/agent', label: 'Агент', icon: 'bot', group: 'settings' },
  { href: '/settings/profile', label: 'Профиль', icon: 'user', group: 'settings' },
];

function Wordmark() {
  return (
    <Link href="/dashboard" className="wordmark">
      <span className="wordmark-mark"><Icon name="bolt" size={17} strokeWidth={2} /></span>
      <span className="wordmark-text">Progon Pro</span>
    </Link>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on route change.
  useEffect(() => { setOpen(false); }, [pathname]);

  const mainItems = NAV_ITEMS.filter((i) => !i.group);
  const settingsItems = NAV_ITEMS.filter((i) => i.group === 'settings');

  const renderItem = (item: (typeof NAV_ITEMS)[number]) => {
    const active =
      pathname === item.href ||
      (item.href !== '/dashboard' && !item.group && pathname.startsWith(item.href));
    return (
      <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
        <span className="nav-icon"><Icon name={item.icon} size={19} /></span>
        <span className="nav-label">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="app-shell">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <Wordmark />
        <button className="icon-btn" aria-label="Меню" onClick={() => setOpen(true)}>
          <Icon name="menu" size={22} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header flex items-center justify-between">
          <Wordmark />
          <button className="icon-btn sidebar-close" aria-label="Закрыть" onClick={() => setOpen(false)}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">{mainItems.map(renderItem)}</div>
          <div className="nav-section">
            <div className="nav-section-title">Настройки</div>
            {settingsItems.map(renderItem)}
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
            <Icon name="logout" size={16} /> Выйти
          </button>
        </div>
      </aside>

      {/* Scrim (mobile) */}
      {open && <div className="sidebar-scrim show" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <main className="main-content">
        <div className={`page-container ${pathname === '/calendar' || pathname === '/apartments' ? 'wide' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
