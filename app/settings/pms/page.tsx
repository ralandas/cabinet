'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { connectPms, testPms, disconnectPms, type PmsTestResult } from '@/lib/api';
import { Icon } from '@/components/icon';

type PmsProvider = 'bnovo' | 'realtycalendar' | '';

export default function PmsSettingsPage() {
  const { token, user, refreshUser } = useAuth();
  const [provider, setProvider] = useState<PmsProvider>('');
  const [busy, setBusy] = useState(false);
  const [testResult, setTestResult] = useState<PmsTestResult | null>(null);
  const [err, setErr] = useState('');

  // Bnovo fields
  const [bnovoUsername, setBnovoUsername] = useState('');
  const [bnovoPassword, setBnovoPassword] = useState('');
  const [bnovoPlanId, setBnovoPlanId] = useState('');
  const [bnovoArrivalTime, setBnovoArrivalTime] = useState('14:00');
  const [bnovoDepartureTime, setBnovoDepartureTime] = useState('12:00');
  const [bnovoMarketingSourceId, setBnovoMarketingSourceId] = useState('');

  // RC fields
  const [rcUserToken, setRcUserToken] = useState('');
  const [rcCookie, setRcCookie] = useState('');
  const [rcDefaultDeposit, setRcDefaultDeposit] = useState('2500');

  const getCredentials = (): Record<string, unknown> => {
    if (provider === 'bnovo') {
      return {
        username: bnovoUsername,
        password: bnovoPassword,
        planId: bnovoPlanId || undefined,
        arrivalTime: bnovoArrivalTime || undefined,
        departureTime: bnovoDepartureTime || undefined,
        marketingSourceId: bnovoMarketingSourceId || undefined,
      };
    }
    return {
      userToken: rcUserToken,
      cookie: rcCookie || undefined,
      defaultDeposit: rcDefaultDeposit ? Number(rcDefaultDeposit) : undefined,
    };
  };

  const handleTest = async () => {
    if (!token || !provider) return;
    setBusy(true);
    setErr('');
    setTestResult(null);
    try {
      const result = await testPms(token, provider, getCredentials());
      setTestResult(result);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка проверки');
    } finally {
      setBusy(false);
    }
  };

  const handleConnect = async () => {
    if (!token || !provider) return;
    setBusy(true);
    setErr('');
    try {
      await connectPms(token, provider, getCredentials());
      await refreshUser();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка подключения');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token || !confirm('Отключить PMS? Агент перестанет видеть бронирования.')) return;
    setBusy(true);
    try {
      await disconnectPms(token);
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
          <Icon name="plug" size={24} style={{ color: 'var(--accent)' }} />
          Подключение PMS
        </h1>
        <p className="subtitle">Подключите систему управления бронированиями</p>
      </div>

      {/* Current status */}
      {user?.pms_connected && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="badge badge-success">Подключено</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {user.pms_provider === 'bnovo' ? 'Bnovo' : 'RealtyCalendar'}
              </span>
            </div>
            <button onClick={handleDisconnect} className="btn btn-danger btn-sm" disabled={busy}>
              Отключить
            </button>
          </div>
        </div>
      )}

      {/* Provider selection */}
      {!user?.pms_connected && (
        <>
          <div className="card mb-4">
            <h2 className="mb-4">Выберите PMS</h2>
            <div className="pms-grid">
              <button
                className={`pms-option ${provider === 'bnovo' ? 'selected' : ''}`}
                onClick={() => setProvider('bnovo')}
              >
                <span className="pms-option-icon"><Icon name="building" size={24} /></span>
                <span className="pms-option-name">Bnovo</span>
                <span className="pms-option-desc">online.bnovo.ru</span>
              </button>
              <button
                className={`pms-option ${provider === 'realtycalendar' ? 'selected' : ''}`}
                onClick={() => setProvider('realtycalendar')}
              >
                <span className="pms-option-icon"><Icon name="calendar" size={24} /></span>
                <span className="pms-option-name">RealtyCalendar</span>
                <span className="pms-option-desc">realtycalendar.ru</span>
              </button>
            </div>
          </div>

          {/* Bnovo form */}
          {provider === 'bnovo' && (
            <div className="card">
              <h2 className="mb-4">Данные Bnovo</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="bnovo-user" className="label-required">Логин</label>
                  <input
                    id="bnovo-user"
                    value={bnovoUsername}
                    onChange={(e) => setBnovoUsername(e.target.value)}
                    placeholder="username от online.bnovo.ru"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bnovo-pass" className="label-required">Пароль</label>
                  <input
                    id="bnovo-pass"
                    type="password"
                    value={bnovoPassword}
                    onChange={(e) => setBnovoPassword(e.target.value)}
                    placeholder="Пароль от кабинета"
                  />
                </div>
              </div>

              <div className="divider" />
              <h3 className="mb-4" style={{ color: 'var(--text-secondary)' }}>Дополнительно (необязательно)</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="bnovo-plan">Plan ID</label>
                  <input
                    id="bnovo-plan"
                    value={bnovoPlanId}
                    onChange={(e) => setBnovoPlanId(e.target.value)}
                    placeholder="53582"
                  />
                  <div className="form-hint">ID тарифного плана из Bnovo</div>
                </div>
                <div className="form-group">
                  <label htmlFor="bnovo-marketing">Marketing Source ID</label>
                  <input
                    id="bnovo-marketing"
                    value={bnovoMarketingSourceId}
                    onChange={(e) => setBnovoMarketingSourceId(e.target.value)}
                    placeholder="36452"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="bnovo-arrival">Время заезда</label>
                  <input
                    id="bnovo-arrival"
                    value={bnovoArrivalTime}
                    onChange={(e) => setBnovoArrivalTime(e.target.value)}
                    placeholder="14:00"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bnovo-departure">Время выезда</label>
                  <input
                    id="bnovo-departure"
                    value={bnovoDepartureTime}
                    onChange={(e) => setBnovoDepartureTime(e.target.value)}
                    placeholder="12:00"
                  />
                </div>
              </div>

              {renderActions()}
            </div>
          )}

          {/* RC form */}
          {provider === 'realtycalendar' && (
            <div className="card">
              <h2 className="mb-4">Данные RealtyCalendar</h2>

              <div className="form-group">
                <label htmlFor="rc-info" style={{ color: 'var(--warning)' }}>
                  Как получить токен
                </label>
                <div className="info-box">
                  <p>1. Откройте <a href="https://realtycalendar.ru" target="_blank" rel="noopener">realtycalendar.ru</a> → войдите</p>
                  <p>2. DevTools (F12) → Network → любой запрос к API</p>
                  <p>3. Скопируйте заголовок <code>x-user-token</code> и <code>Cookie</code></p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="rc-token" className="label-required">User Token (x-user-token)</label>
                <input
                  id="rc-token"
                  value={rcUserToken}
                  onChange={(e) => setRcUserToken(e.target.value)}
                  placeholder="Долгоживущий токен из заголовков"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="rc-cookie">Cookie (опционально)</label>
                <textarea
                  id="rc-cookie"
                  value={rcCookie}
                  onChange={(e) => setRcCookie(e.target.value)}
                  placeholder="Значение Cookie из заголовков запроса"
                  style={{ minHeight: '60px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="rc-deposit">Депозит по умолчанию, ₽</label>
                <input
                  id="rc-deposit"
                  type="number"
                  value={rcDefaultDeposit}
                  onChange={(e) => setRcDefaultDeposit(e.target.value)}
                  placeholder="2500"
                />
              </div>

              {renderActions()}
            </div>
          )}
        </>
      )}
    </div>
  );

  function renderActions() {
    return (
      <>
        {testResult && (
          <div className="card mt-4" style={{ background: 'var(--success-quiet)', border: '1px solid var(--success-border)' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontWeight: 600 }}>
              <Icon name="check" size={16} />
              Найдено объектов: {testResult.properties_count}
            </p>
            {testResult.properties.length > 0 && (
              <ul style={{ marginTop: 8, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {testResult.properties.map((p) => (
                  <li key={p.id}>{p.title}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {err && <div className="form-error mt-4">{err}</div>}
        <div className="flex gap-3 mt-6">
          <button onClick={handleTest} className="btn btn-secondary" disabled={busy}>
            {busy ? <><span className="spinner" /> Проверяю...</> : <><Icon name="search" size={16} /> Проверить подключение</>}
          </button>
          <button onClick={handleConnect} className="btn btn-primary" disabled={busy}>
            {busy ? <><span className="spinner" /> Подключаю...</> : <><Icon name="bolt" size={16} /> Подключить</>}
          </button>
        </div>
      </>
    );
  }
}
