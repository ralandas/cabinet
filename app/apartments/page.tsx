'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listApartments, deleteApartment, type Apartment } from '@/lib/api';
import Link from 'next/link';

export default function ApartmentsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Apartment[] | null>(null);
  const [err, setErr] = useState('');

  const load = () => {
    if (!token) return;
    listApartments(token)
      .then(setItems)
      .catch((e) => setErr(e.message));
  };

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id: string, title: string) => {
    if (!token || !confirm(`Удалить «${title}»? Это действие необратимо.`)) return;
    await deleteApartment(token, id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>🏠 Квартиры</h1>
          <p className="subtitle">Добавляйте квартиры, заполняйте правила, заселение и фото</p>
        </div>
        <Link href="/apartments/new" className="btn btn-primary">
          + Добавить квартиру
        </Link>
      </div>

      {err && <div className="form-error mb-4">{err}</div>}
      {!items && !err && (
        <div className="loading-page" style={{ minHeight: '200px' }}>
          <div className="spinner" />
        </div>
      )}

      {items?.length === 0 && (
        <div className="empty-state">
          <div className="emoji">🏠</div>
          <h3>Пока нет квартир</h3>
          <p>Добавьте первую квартиру — бот будет показывать её гостям</p>
          <Link href="/apartments/new" className="btn btn-primary">
            + Добавить квартиру
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items?.map((a) => (
          <div key={a.id} className="status-card interactive" style={{ cursor: 'default' }}>
            <Link href={`/apartments/${a.id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="icon blue">🏠</div>
              <div className="info">
                <h3>{a.title}</h3>
                <p>
                  {a.price ? `${a.price.toLocaleString()} ₽/ночь` : 'цена не указана'}
                  {a.rc_apartment_id ? ` · RC ${a.rc_apartment_id}` : ''}
                  {a.photo_count ? ` · ${a.photo_count} фото` : ''}
                </p>
              </div>
            </Link>
            <button
              onClick={() => remove(a.id, a.title)}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger)' }}
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
