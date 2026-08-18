'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAgentStatus, startAgent, stopAgent, type AgentStatus } from '@/lib/api';

export default function AgentSettingsPage() {
  const { token, user, refreshUser } = useAuth();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getAgentStatus(token)
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleStart = async () => {
    if (!token) return;
    setBusy(true);
    setErr('');
    try {
      await startAgent(token);
      const s = await getAgentStatus(token);
      setStatus(s);
      await refreshUser();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка запуска');
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!token || !confirm('Остановить агента? Он перестанет отвечать гостям.')) return;
    setBusy(true);
    setErr('');
    try {
      await stopAgent(token);
      const s = await getAgentStatus(token);
      setStatus(s);
      await refreshUser();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  const ready = status?.pms_connected && status?.tg_connected;

  return (
    <div>
      <div className="mb-6">
        <h1>🤖 ИИ Агент</h1>
        <p className="subtitle">Управляйте ИИ-агентом, который общается с гостями</p>
      </div>

      {/* Status card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2">Статус</h2>
            <div className="flex items-center gap-3">
              {status?.running ? (
                <>
                  <span className="status-dot active" />
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>Работает</span>
                </>
              ) : (
                <>
                  <span className="status-dot inactive" />
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Остановлен</span>
                </>
              )}
            </div>
          </div>
          <div>
            {status?.running ? (
              <button onClick={handleStop} className="btn btn-danger" disabled={busy}>
                {busy ? <><span className="spinner" /> Останавливаю...</> : '⏹ Остановить'}
              </button>
            ) : (
              <button onClick={handleStart} className="btn btn-success btn-lg" disabled={busy || !ready}>
                {busy ? <><span className="spinner" /> Запускаю...</> : '▶ Запустить агента'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      <div className="card mb-6">
        <h2 className="mb-4">Предпосылки</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {status?.tg_connected ? (
              <span className="badge badge-success">✓ Telegram</span>
            ) : (
              <span className="badge badge-danger">✕ Telegram</span>
            )}
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {status?.tg_connected ? 'Аккаунт подключён' : 'Необходимо подключить Telegram аккаунт'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {status?.pms_connected ? (
              <span className="badge badge-success">✓ PMS</span>
            ) : (
              <span className="badge badge-danger">✕ PMS</span>
            )}
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {status?.pms_connected ? 'PMS подключена' : 'Необходимо подключить Bnovo или RealtyCalendar'}
            </span>
          </div>
        </div>
        {!ready && (
          <p className="form-hint mt-4" style={{ color: 'var(--warning)' }}>
            ⚠️ Оба подключения обязательны для запуска агента
          </p>
        )}
      </div>

      {/* How it works */}
      <div className="card">
        <h2 className="mb-4">Как работает агент</h2>
        <div className="flex flex-col gap-3" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <p>📨 Принимает сообщения от гостей в Telegram</p>
          <p>🏠 Ищет доступные квартиры и показывает фото</p>
          <p>💰 Называет актуальные цены из PMS</p>
          <p>📋 Автоматически создаёт бронь</p>
          <p>💳 Отправляет ссылку на оплату</p>
          <p>⏰ Напоминает об оплате и отменяет неоплаченные</p>
          <p>🧹 Уведомляет горничных о выездах</p>
        </div>
      </div>

      {err && <div className="form-error mt-4">{err}</div>}
    </div>
  );
}
