'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  getApartment,
  createApartment,
  updateApartment,
  uploadPhoto,
  deletePhoto,
  photoUrl,
  type ApartmentInput,
} from '@/lib/api';
import { Icon } from '@/components/icon';

export default function ApartmentEditPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState<ApartmentInput>({ title: '' });
  const [realId, setRealId] = useState<string | null>(isNew ? null : id);
  // A card that lives only in the PMS (not yet in our DB) has no real DB row —
  // saving it must CREATE one, not PUT to a non-existent id.
  const [fromPms, setFromPms] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (isNew || !token) return;
    getApartment(token, id)
      .then(({ apartment: a, photos }) => {
        setForm({
          title: a.title,
          address: a.address ?? undefined,
          price: a.price ?? undefined,
          rules: a.rules ?? undefined,
          checkinInstructions: a.checkin_instructions ?? undefined,
          wifiName: a.wifi_name ?? undefined,
          wifiPassword: a.wifi_password ?? undefined,
          extra: a.extra ?? undefined,
          rcApartmentId: a.rc_apartment_id ?? (a.from_pms ? a.id : undefined),
        });
        // A PMS-sourced card isn't persisted yet: mark it and drop realId so the
        // photo uploader stays hidden until it's saved (which creates the DB row).
        if (a.from_pms) {
          setFromPms(true);
          setRealId(null);
        }
        setPhotos(photos);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [token, id, isNew]);

  const set = (patch: Partial<ApartmentInput>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!token || !form.title?.trim()) {
      setErr('Укажите название');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      if (realId) {
        await updateApartment(token, realId, form);
      } else {
        // New card, or a PMS card being persisted for the first time.
        const a = await createApartment(token, form);
        setRealId(a.id);
        setFromPms(false);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (files: FileList | null) => {
    if (!files || !realId || !token) return;
    setUploading(true);
    setErr('');
    try {
      let latest = photos;
      for (const f of Array.from(files)) latest = await uploadPhoto(token, realId, f);
      setPhotos(latest);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div>
      <button onClick={() => router.push('/apartments')} className="btn btn-ghost mb-4">
        <Icon name="chevron-left" size={16} /> К списку
      </button>

      <div className="mb-6">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isNew && <Icon name="home" size={24} style={{ color: 'var(--accent)' }} />}
          {isNew ? 'Новая квартира' : form.title || 'Квартира'}
        </h1>
        <p className="subtitle">Эти данные бот использует в переписке с гостями</p>
      </div>

      {fromPms && (
        <div className="card mb-4" style={{ background: 'var(--accent-quiet)', borderColor: 'var(--accent-border)', padding: '12px 16px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--accent-hover)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="sparkle" size={16} />
            Квартира подтянута из PMS. Заполните правила, заселение и Wi‑Fi и нажмите «Сохранить» — она добавится в базу, и появится загрузка фото.
          </p>
        </div>
      )}

      <div className="card">
        <div className="form-group">
          <label htmlFor="apt-title" className="label-required">Название</label>
          <div className="form-hint">Как квартира отображается гостю</div>
          <input
            id="apt-title"
            value={form.title ?? ''}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Шилова 12, студия"
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="apt-price">Цена за ночь, ₽</label>
            <div className="form-hint">Базовая цена</div>
            <input
              id="apt-price"
              type="number"
              value={form.price ?? ''}
              onChange={(e) => set({ price: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="3100"
            />
          </div>
          <div className="form-group">
            <label htmlFor="apt-rc">ID в Realty Calendar</label>
            <div className="form-hint">Если брони идут через RC</div>
            <input
              id="apt-rc"
              value={form.rcApartmentId ?? ''}
              onChange={(e) => set({ rcApartmentId: e.target.value })}
              placeholder="281403"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="apt-address">Адрес</label>
          <input
            id="apt-address"
            value={form.address ?? ''}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="г. Чита, ул. Шилова, 12"
          />
        </div>

        {/* Photos */}
        <div className="form-group">
          <label>Фото</label>
          <div className="form-hint">
            {realId
              ? 'Бот отправит их гостю по запросу'
              : fromPms
                ? 'Фото из PMS. Сохраните квартиру, чтобы добавлять свои.'
                : 'Сначала сохраните квартиру, потом добавьте фото'}
          </div>
          {/* PMS card: show its photos read-only (full URLs, no delete). */}
          {!realId && fromPms && photos.length > 0 && (
            <div className="photos-grid mt-2">
              {photos.map((f) => (
                <div className="photo-item" key={f}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(id, f)} alt="" />
                </div>
              ))}
            </div>
          )}
          {realId && (
            <div className="photos-grid mt-2">
              {photos.map((f) => (
                <div className="photo-item" key={f}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(realId, f)} alt={f} />
                  <button
                    type="button"
                    className="photo-delete"
                    onClick={async () => {
                      if (!token) return;
                      setPhotos(await deletePhoto(token, realId, f));
                    }}
                    aria-label="Удалить фото"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
              <label className="photo-uploader">
                {uploading ? '…' : <><Icon name="plus" size={18} /> Фото</>}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => onUpload(e.target.files)}
                />
              </label>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="apt-checkin">Как заселиться</label>
          <div className="form-hint">Код подъезда, где ключница, код от неё</div>
          <textarea
            id="apt-checkin"
            value={form.checkinInstructions ?? ''}
            onChange={(e) => set({ checkinInstructions: e.target.value })}
            placeholder="Заселение дистанционное..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="apt-rules">Правила проживания</label>
          <div className="form-hint">Курение, тишина, гости, животные, депозит</div>
          <textarea
            id="apt-rules"
            value={form.rules ?? ''}
            onChange={(e) => set({ rules: e.target.value })}
            placeholder="Не курить. Тишина с 22:00..."
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="apt-wifi-name">Wi‑Fi: сеть</label>
            <input
              id="apt-wifi-name"
              value={form.wifiName ?? ''}
              onChange={(e) => set({ wifiName: e.target.value })}
              placeholder="Shilova12"
            />
          </div>
          <div className="form-group">
            <label htmlFor="apt-wifi-pass">Wi‑Fi: пароль</label>
            <input
              id="apt-wifi-pass"
              value={form.wifiPassword ?? ''}
              onChange={(e) => set({ wifiPassword: e.target.value })}
              placeholder="12345678"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="apt-extra">Дополнительно</label>
          <div className="form-hint">Парковка, лифт, мусор</div>
          <textarea
            id="apt-extra"
            value={form.extra ?? ''}
            onChange={(e) => set({ extra: e.target.value })}
            placeholder="Парковка во дворе бесплатная."
          />
        </div>

        {err && <div className="form-error">{err}</div>}

        <div className="mt-6">
          <button onClick={save} className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Сохраняю…' : realId ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="toast">
          <Icon name="check" size={16} style={{ color: 'var(--success)' }} /> Сохранено
        </div>
      )}
    </div>
  );
}
