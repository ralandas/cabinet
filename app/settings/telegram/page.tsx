'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { connectTelegram, testTelegram, disconnectTelegram } from '@/lib/api';
import { Icon } from '@/components/icon';

export default function TelegramSettingsPage() {
  const { token, user, refreshUser } = useAuth();
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [session, setSession] = useState('');
  const [proxy, setProxy] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [err, setErr] = useState('');

  const handleTest = async () => {
    if (!token) return;
    setBusy(true);
    setErr('');
    setTestResult(null);
    try {
      const result = await testTelegram(token, {
        apiId: Number(apiId),
        apiHash,
        session,
        proxy: proxy || undefined,
      });
      setTestResult(
        result.authorized
          ? { ok: true, msg: 'Сессия активна и авторизована!' }
          : { ok: false, msg: 'Сессия не авторизована' }
      );
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка проверки');
    } finally {
      setBusy(false);
    }
  };

  const handleConnect = async () => {
    if (!token) return;
    setBusy(true);
    setErr('');
    try {
      await connectTelegram(token, {
        apiId: Number(apiId),
        apiHash,
        session,
        proxy: proxy || undefined,
        username: username || undefined,
        privateOnly: true,
        polling: true,
      });
      await refreshUser();
      setTestResult({ ok: true, msg: 'Telegram успешно подключён!' });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка подключения');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token || !confirm('Отключить Telegram аккаунт?')) return;
    setBusy(true);
    setErr('');
    try {
      await disconnectTelegram(token);
      await refreshUser();
      setTestResult(null);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="message" size={24} style={{ color: 'var(--accent)' }} />
          Telegram аккаунт
        </h1>
        <p className="subtitle">Подключите личный аккаунт, от имени которого агент общается с гостями</p>
      </div>

      {/* Current status */}
      {user?.tg_connected && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="badge badge-success">Подключён</span>
              {user.tg_username && <span style={{ color: 'var(--text-secondary)' }}>@{user.tg_username}</span>}
            </div>
            <button onClick={handleDisconnect} className="btn btn-danger btn-sm" disabled={busy}>
              Отключить
            </button>
          </div>
        </div>
      )}

      {/* Connection form */}
      {!user?.tg_connected && (
        <div className="card">
          <h2 className="mb-4">Подключение</h2>

          <div className="form-group">
            <label htmlFor="tg-info" className="label-required" style={{ color: 'var(--warning)' }}>
              Как получить данные
            </label>
            <div className="info-box">
              <p>1. Перейдите на <a href="https://my.telegram.org" target="_blank" rel="noopener">my.telegram.org</a></p>
              <p>2. Войдите → API development tools → Create application</p>
              <p>3. Скопируйте <strong>API ID</strong> и <strong>API Hash</strong></p>
              <p>4. Session String генерируется через gramjs CLI-скрипт (спросите у нас инструкцию)</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tg-api-id" className="label-required">API ID</label>
              <input
                id="tg-api-id"
                type="number"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div className="form-group">
              <label htmlFor="tg-api-hash" className="label-required">API Hash</label>
              <input
                id="tg-api-hash"
                type="text"
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                placeholder="a1b2c3d4e5f6..."
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tg-session" className="label-required">Session String</label>
            <textarea
              id="tg-session"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="1BVtsOH0Bu7..."
              style={{ minHeight: '80px', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <div className="form-hint">Секретная строка авторизованной сессии gramjs</div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="tg-proxy">Proxy (опционально)</label>
              <input
                id="tg-proxy"
                type="text"
                value={proxy}
                onChange={(e) => setProxy(e.target.value)}
                placeholder="socks5://user:pass@host:port"
              />
              <div className="form-hint">SOCKS5 прокси для гео-привязки аккаунта</div>
            </div>
            <div className="form-group">
              <label htmlFor="tg-username">Username (опционально)</label>
              <input
                id="tg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@my_admin_bot"
              />
              <div className="form-hint">Публичный @username для аккаунта</div>
            </div>
          </div>

          {testResult && (
            <div
              className="form-hint mt-4"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: testResult.ok ? 'var(--success)' : 'var(--danger)',
              }}
            >
              <Icon name={testResult.ok ? 'check' : 'x'} size={15} />
              {testResult.msg}
            </div>
          )}
          {err && <div className="form-error">{err}</div>}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleTest}
              className="btn btn-secondary"
              disabled={busy || !apiId || !apiHash || !session}
            >
              {busy ? <><span className="spinner" /> Проверяю...</> : <><Icon name="search" size={16} /> Проверить сессию</>}
            </button>
            <button
              onClick={handleConnect}
              className="btn btn-primary"
              disabled={busy || !apiId || !apiHash || !session}
            >
              {busy ? <><span className="spinner" /> Подключаю...</> : <><Icon name="bolt" size={16} /> Подключить</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
