'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  startTelegramLogin,
  confirmTelegramLogin,
  resendTelegramCode,
  cancelTelegramLogin,
  getTelegramStatus,
  disconnectTelegram,
  type TgStatus,
} from '@/lib/api';
import { Icon } from '@/components/icon';

type Step = 'phone' | 'code' | 'password';

export default function TelegramSettingsPage() {
  const { token, user, refreshUser } = useAuth();
  const [status, setStatus] = useState<TgStatus | null>(null);
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [viaApp, setViaApp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submitting = useRef(false);

  useEffect(() => {
    if (!token) return;
    getTelegramStatus(token)
      .then((s) => {
        setStatus(s);
        if (s.pending?.need_password) {
          setStep('password');
          setPhoneMasked(s.pending.phone_masked);
        } else if (s.pending) {
          setStep('code');
          setPhoneMasked(s.pending.phone_masked);
          setViaApp(s.pending.via_app);
        }
      })
      .catch(() => {});
  }, [token]);

  const connected = user?.tg_connected || status?.connected;

  const handleStart = async () => {
    if (!token || !phone.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const r = await startTelegramLogin(token, phone.trim());
      setPhoneMasked(r.phone_masked);
      setViaApp(r.via_app);
      setCode('');
      setStep('code');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Не удалось отправить код');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCode = async (value?: string) => {
    if (!token) return;
    const next = (value ?? code).replace(/\D/g, '');
    if (next.length < 4) return;
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setErr('');
    try {
      const r = await confirmTelegramLogin(token, { code: next });
      if (r.need_password) {
        setStep('password');
        setPassword('');
        return;
      }
      await refreshUser();
      const s = await getTelegramStatus(token);
      setStatus(s);
      setStep('phone');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Неверный код');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const handleConfirmPassword = async () => {
    if (!token || !password.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const r = await confirmTelegramLogin(token, { password: password.trim() });
      if (r.need_password) {
        setErr(r.hint || 'Введите облачный пароль');
        return;
      }
      await refreshUser();
      const s = await getTelegramStatus(token);
      setStatus(s);
      setPassword('');
      setStep('phone');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Неверный пароль');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!token) return;
    setBusy(true);
    setErr('');
    try {
      const r = await resendTelegramCode(token);
      setViaApp(r.via_app);
      setPhoneMasked(r.phone_masked);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Не удалось отправить код');
    } finally {
      setBusy(false);
    }
  };

  const handleBack = async () => {
    if (token) await cancelTelegramLogin(token).catch(() => {});
    setStep('phone');
    setCode('');
    setPassword('');
    setErr('');
  };

  const handleDisconnect = async () => {
    if (!token || !confirm('Отключить Telegram? Агент перестанет отвечать гостям в этом аккаунте.')) return;
    setBusy(true);
    setErr('');
    try {
      await disconnectTelegram(token);
      await refreshUser();
      setStatus(null);
      setStep('phone');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const displayName =
    status?.first_name ||
    (status?.username ? `@${status.username}` : null) ||
    user?.tg_username ||
    null;

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="message" size={24} style={{ color: 'var(--accent)' }} />
          Telegram
        </h1>
        <p className="subtitle">Агент будет писать гостям от вашего аккаунта — как живой администратор</p>
      </div>

      {connected && (
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="badge badge-success">Подключён</span>
                {displayName && (
                  <span style={{ fontWeight: 600 }}>
                    {status?.first_name}
                    {status?.username ? (
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {' '}
                        @{status.username}
                      </span>
                    ) : user?.tg_username ? (
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {' '}
                        @{user.tg_username}
                      </span>
                    ) : null}
                  </span>
                )}
              </div>
              {(status?.phone_masked || user?.tg_username) && (
                <p className="form-hint" style={{ marginTop: 8, marginBottom: 0 }}>
                  {status?.phone_masked ?? 'Сессия активна'}
                </p>
              )}
            </div>
            <button onClick={handleDisconnect} className="btn btn-danger btn-sm" disabled={busy}>
              Отключить
            </button>
          </div>
        </div>
      )}

      {!connected && (
        <div className="card" style={{ maxWidth: 480 }}>
          {step === 'phone' && (
            <>
              <h2 className="mb-2">Вход по номеру</h2>
              <p className="subtitle" style={{ marginBottom: 20 }}>
                Код придёт в Telegram или SMS — как при обычном входе
              </p>
              <div className="form-group">
                <label htmlFor="tg-phone" className="label-required">
                  Номер телефона
                </label>
                <input
                  id="tg-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  placeholder="+7 914 000-00-00"
                  autoFocus
                />
              </div>
              {err && <div className="form-error">{err}</div>}
              <button
                onClick={handleStart}
                className="btn btn-primary"
                disabled={busy || phone.replace(/\D/g, '').length < 10}
                style={{ marginTop: 8 }}
              >
                {busy ? (
                  <>
                    <span className="spinner" /> Отправляю код...
                  </>
                ) : (
                  <>
                    <Icon name="bolt" size={16} /> Получить код
                  </>
                )}
              </button>
            </>
          )}

          {step === 'code' && (
            <>
              <h2 className="mb-2">Код подтверждения</h2>
              <p className="subtitle" style={{ marginBottom: 20 }}>
                {viaApp
                  ? `Код отправили в приложение Telegram на номер ${phoneMasked}`
                  : `Код отправили SMS на ${phoneMasked}`}
              </p>
              <div className="form-group">
                <label htmlFor="tg-code" className="label-required">
                  Код
                </label>
                <input
                  id="tg-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(next);
                    if (next.length >= 5) void handleConfirmCode(next);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmCode()}
                  placeholder="12345"
                  autoFocus
                  style={{
                    letterSpacing: '0.28em',
                    fontSize: '1.35rem',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                />
              </div>
              {err && <div className="form-error">{err}</div>}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleConfirmCode()}
                  className="btn btn-primary"
                  disabled={busy || code.length < 4}
                >
                  {busy ? (
                    <>
                      <span className="spinner" /> Проверяю...
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={16} /> Войти
                    </>
                  )}
                </button>
                <button onClick={handleResend} className="btn btn-secondary" disabled={busy}>
                  Выслать ещё раз
                </button>
              </div>
              <button
                className="btn btn-ghost"
                style={{ marginTop: 12, paddingLeft: 0 }}
                onClick={handleBack}
                disabled={busy}
              >
                Другой номер
              </button>
            </>
          )}

          {step === 'password' && (
            <>
              <h2 className="mb-2">Облачный пароль</h2>
              <p className="subtitle" style={{ marginBottom: 20 }}>
                У аккаунта включена двухэтапная проверка. Это пароль из настроек Telegram, не код из SMS.
              </p>
              <div className="form-group">
                <label htmlFor="tg-2fa" className="label-required">
                  Пароль
                </label>
                <input
                  id="tg-2fa"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmPassword()}
                  placeholder="Облачный пароль"
                  autoFocus
                />
              </div>
              {err && <div className="form-error">{err}</div>}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleConfirmPassword}
                  className="btn btn-primary"
                  disabled={busy || !password.trim()}
                >
                  {busy ? (
                    <>
                      <span className="spinner" /> Вхожу...
                    </>
                  ) : (
                    <>
                      <Icon name="lock" size={16} /> Подтвердить
                    </>
                  )}
                </button>
                <button onClick={handleBack} className="btn btn-secondary" disabled={busy}>
                  Назад
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
