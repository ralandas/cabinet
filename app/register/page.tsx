'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Icon } from '@/components/icon';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const isEmail = loginId.includes('@');
      await register({
        email: isEmail ? loginId.trim() : undefined,
        phone: isEmail ? undefined : loginId.trim(),
        password,
        name: name.trim() || undefined,
      });
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка регистрации');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="wordmark auth-logo">
            <span className="wordmark-mark"><Icon name="bolt" size={20} strokeWidth={2} /></span>
            <span className="wordmark-text">Progon Pro</span>
          </div>
          <h1>Регистрация</h1>
          <p className="subtitle">Создайте аккаунт и подключите ИИ-агента за 5 минут</p>
        </div>

        <form onSubmit={submit} className="card auth-card">
          <div className="form-group">
            <label htmlFor="reg-name">Имя</label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-login" className="label-required">Email или телефон</label>
            <input
              id="reg-login"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="you@mail.ru или +7..."
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="label-required">Пароль</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
            />
          </div>

          {err && <div className="form-error">{err}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={busy || !loginId || !password}
          >
            {busy ? (
              <><span className="spinner" /> Регистрация...</>
            ) : (
              'Создать аккаунт'
            )}
          </button>

          <div className="auth-switch">
            Уже есть аккаунт?{' '}
            <Link href="/login">Войти</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
