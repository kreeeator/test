# KR STORE Analytics

Простой приватный кабинет аналитики для одного администратора на базе Next.js + Postgres + Prisma с синхронизацией Google Sheets и заделом под Avito.

## 1) ТЗ и архитектура

### Цель
- Один админ (без регистрации) видит:
  - Dashboard (today/week/month)
  - Наличие (склад)
  - Продажи (журнал)
  - MVP-2: quick-sale кнопка `POST /api/quick-sale`

### Допущения (упрощения MVP)
1. Для авторизации используется один логин/пароль из `.env`.
2. JWT не используется: только серверная cookie `session` (`httpOnly`, `sameSite=lax`).
3. CSRF риск снижен через `sameSite=lax` и закрытую админку; для усиления можно добавить double-submit token.
4. Avito API в MVP-1 не обязателен для вычислений. Добавлен слой `SyncLog` и место под токены/кэш.
5. Источник правды — Google Sheets, локальная БД служит кэшем для быстрых фильтров/агрегаций.

### Потоки данных
1. UI -> API (`/api/dashboard`, `/api/inventory`, `/api/sales`).
2. API вызывает `ensureRecentSync()`:
   - если последний `SyncLog` старше 5 минут, тянем Sheets (`Наличие`, `Продажи`),
   - сохраняем в локальную БД (`upsert`).
3. API считает агрегаты из БД и возвращает JSON.
4. MVP-2 `quick-sale`:
   - валидирует поля,
   - проверяет остаток,
   - транзакционно пишет продажу в БД и уменьшает остаток,
   - пишет строку в `Продажи` Sheets,
   - обновляет stock в `Наличие` Sheets,
   - защищён `x-idempotency-key`.

### Формулы расчётов
- `Выручка = Σ amount`
- `Комиссии = Σ commission`
- `Себестоимость = Σ (purchasePrice * quantity)`
- `Чистый доход = Выручка - Комиссии - Себестоимость`
- `Маржинальность % = (Чистый доход / Выручка) * 100`, если выручка > 0, иначе 0
- `Продано штук = Σ quantity`
- `Средний чек = Выручка / кол-во заказов`, если заказов > 0, иначе 0
- `Деньги в складе = Σ(stock * purchasePrice)`
- `Прибыль по товару = Σ(amount - commission - purchasePrice*quantity) по sku`
- `Мёртвый груз = товар без продаж > X дней` (константа `DEAD_STOCK_DAYS`)
- `Топ-товары по прибыли = top N sku по прибыльности` (константа `TOP_SALES_N`)

### Маппинг колонок Google Sheets
`lib/sheets.ts` использует map по header (lowercase), поддерживает алиасы:
- SKU: `sku`
- ID: `id`, `itemid`, `id товара`
- Наименование: `name`, `title`
- Остаток: `stock`, `qty`
- Закуп: `purchase`, `закуп`
- Дата продажи: `date`
- Сумма: `sum`, `amount`
- Канал: `platform`, `channel`

Если критичных колонок нет — строка пропускается, сервис не падает.

## 2) Схема данных (Prisma)
- `InventoryItem`: склад
- `Sale`: журнал продаж
- `SyncLog`: журнал синхронизаций
- `IdempotencyKey`: защита от двойного сабмита

## 3) API endpoints
- `POST /api/auth/login` — логин + rate-limit (5 попыток / 5 минут на IP)
- `POST /api/auth/logout` — выход
- `POST /api/toggle-finance` — скрыть/показать финансы
- `GET /api/dashboard?period=today|week|month`
- `GET /api/inventory?q=&model=&color=&size=&sort=`
- `GET /api/sales?dateFrom=&dateTo=&channel=&q=`
- `POST /api/quick-sale` (MVP-2)
- `GET /api/health`

## 4) Структура проекта

```text
app/
  login/
  dashboard/
  inventory/
  sales/
  api/
components/
lib/
prisma/
scripts/
```

## 5) Пошаговый план (итерации)

### MVP-1
1. База проекта, Prisma, Postgres, middleware авторизации.
2. Логин/логаут, rate-limit.
3. Синк `Наличие` + `Продажи` из Sheets в БД.
4. Dashboard метрики + 3 графика (JSON-представление).
5. Страница Наличие: поиск/фильтры/сортировки/бейджи.
6. Страница Продажи: фильтры + summary.
7. Маскирование финансов по умолчанию + переключатель.
8. Healthcheck, Docker, README.

### MVP-2
1. Форма/кнопка “Продал”.
2. API `/api/quick-sale` + идемпотентность.
3. Запись в `Продажи` и обновление `Наличие` в Sheets.
4. UX защита от двойного клика + оптимистическое обновление.

## 6) Безопасность
- Весь доступ закрыт middleware (кроме `/login`, `/api/auth/login`, `/api/health`).
- Cookie session: `httpOnly`, `sameSite=lax`, `secure` в prod.
- Защита от brute-force на логине.
- ORM Prisma защищает от SQL injection.
- React escaping + отсутствие `dangerouslySetInnerHTML` снижает XSS риск.
- Рекомендация backup: pg_dump + ежедневный cron + offsite storage.

## 7) Запуск локально

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## 8) Деплой на VPS (Timeweb/любой VPS)

```bash
docker compose up -d --build
```

После первого старта:
```bash
docker compose exec app npx prisma migrate deploy
```

## 9) Логи и health
- Логи: `docker compose logs -f app`
- Health: `GET /api/health`

## 10) Avito API (рекомендованный следующий шаг)
1. Таблица `AvitoToken` (access, refresh, expiresAt).
2. Cron на refresh токена.
3. Таблица `AvitoStatCache` с TTL.
4. Единый `data sync worker` (node-cron / queue) и ретраи.
