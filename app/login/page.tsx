'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Icon } from '@/components/icon';

export default function LoginPage() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(loginId.trim(), password);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка входа');
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
          <h1>Вход в кабинет</h1>
          <p className="subtitle">Управляйте ИИ-агентом для вашей посуточной аренды</p>
        </div>

        <form onSubmit={submit} className="card auth-card">
          <div className="form-group">
            <label htmlFor="login-id">Email или телефон</label>
            <input
              id="login-id"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="you@mail.ru или +7..."
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Пароль</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete="current-password"
            />
          </div>

          {err && <div className="form-error">{err}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={busy || !loginId || !password}
          >
            {busy ? (
              <><span className="spinner" /> Вхожу...</>
            ) : (
              'Войти'
            )}
          </button>

          <div className="auth-switch">
            Нет аккаунта?{' '}
            <Link href="/register">Зарегистрироваться</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
