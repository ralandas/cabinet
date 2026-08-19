'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Icon } from '@/components/icon';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  const steps = [
    {
      key: 'telegram',
      title: 'Telegram аккаунт',
      description: user?.tg_connected
        ? `Подключён${user.tg_username ? ` · @${user.tg_username}` : ''}`
        : 'Войдите по номеру телефона — агент будет писать гостям от вашего имени',
      connected: user?.tg_connected ?? false,
      href: '/settings/telegram',
      icon: 'message',
    },
    {
      key: 'pms',
      title: `PMS${user?.pms_connected ? ` · ${user.pms_provider === 'bnovo' ? 'Bnovo' : 'RealtyCalendar'}` : ''}`,
      description: user?.pms_connected
        ? 'Подключено — агент видит бронирования и квартиры'
        : 'Подключите Bnovo или RealtyCalendar для работы с бронированиями',
      connected: user?.pms_connected ?? false,
      href: '/settings/pms',
      icon: 'plug',
    },
    {
      key: 'agent',
      title: 'ИИ Агент',
      description: user?.agent_running
        ? 'Работает — отвечает гостям и создаёт брони'
        : user?.tg_connected && user?.pms_connected
          ? 'Готов к запуску — все подключения на месте'
          : 'Сначала подключите Telegram и PMS',
      connected: user?.agent_running ?? false,
      ready: (user?.tg_connected && user?.pms_connected) ?? false,
      href: '/settings/agent',
      icon: 'bot',
    },
  ];

  const completedSteps = steps.filter((s) => s.connected).length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  return (
    <div>
      <div className="mb-6">
        <h1>Добро пожаловать{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="subtitle">Настройте подключения, чтобы ИИ-агент начал работать</p>
      </div>

      {/* Progress bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3>Готовность</h3>
          <span className="badge badge-info tnum">{completedSteps} из {steps.length}</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="form-hint mt-2" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {progress === 100 ? (
            <>
              <Icon name="check" size={15} style={{ color: 'var(--success)' }} />
              Всё настроено — агент готов к работе.
            </>
          ) : (
            'Выполните все шаги ниже для запуска агента.'
          )}
        </p>
      </div>

      {/* Status cards */}
      <div className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <Link key={step.key} href={step.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="status-card interactive">
              <div className={`step-number ${step.connected ? 'done' : ''}`}>
                {step.connected ? (
                  <Icon name="check" size={15} />
                ) : (
                  <span className="step-num">{i + 1}</span>
                )}
              </div>
              <div className={`icon-tile ${step.connected ? 'green' : 'ready' in step && (step as { ready?: boolean }).ready ? 'yellow' : 'blue'}`}>
                <Icon name={step.icon} size={20} />
              </div>
              <div className="info">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              <div>
                {step.connected ? (
                  <span className="badge badge-success">Подключено</span>
                ) : 'ready' in step && (step as { ready?: boolean }).ready ? (
                  <span className="badge badge-warning">Готов</span>
                ) : (
                  <span className="badge badge-neutral">Не подключено</span>
                )}
              </div>
              <span className="nav-arrow"><Icon name="arrow-right" size={18} /></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
