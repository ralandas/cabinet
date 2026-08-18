'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/api';

export default function ProfileSettingsPage() {
  const { user, refreshUser, token, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!token) return;
    setBusy(true);
    setErr('');
    try {
      await updateProfile(token, {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1>👤 Профиль</h1>
        <p className="subtitle">Ваши данные и настройки аккаунта</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label htmlFor="profile-name">Имя</label>
          <input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.ru"
            />
          </div>
          <div className="form-group">
            <label htmlFor="profile-phone">Телефон</label>
            <input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7..."
            />
          </div>
        </div>

        {err && <div className="form-error">{err}</div>}

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn btn-primary" disabled={busy}>
            {busy ? <><span className="spinner" /> Сохраняю...</> : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="divider" />

      <div className="card" style={{ borderColor: 'var(--danger-border)' }}>
        <h3 style={{ color: 'var(--danger)' }}>Опасная зона</h3>
        <p className="subtitle mb-4">Выход из аккаунта удалит сохранённый токен на этом устройстве</p>
        <button onClick={logout} className="btn btn-danger">
          Выйти из аккаунта
        </button>
      </div>

      {saved && <div className="toast">Сохранено ✓</div>}
    </div>
  );
}
