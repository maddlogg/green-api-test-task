# Green API Test Task — Контекст реализации

## 1. Описание проекта

Веб-приложение в стиле **Messenger Web** для работы с Green API.
Стек: **React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + shadcn/ui + lucide-react**.

Реализованы:

- **Отправка текстовых сообщений** через Green API по номеру телефона.
- **Получение входящих сообщений** через long polling (`receiveNotification`).
- **Логика прочитанных/непрочитанных** входящих сообщений (счётчик в сайдбаре, разделитель в чате).

## 2. Функциональные требования

### 2.1. Авторизация (экран входа)

- Перед использованием приложения пользователь обязан ввести 2 параметра:
  - `idInstance` — строка
  - `apiTokenInstance` — строка
- Валидация: оба поля **не должны быть пустыми** (проверка `trim()`).
- После успешного ввода параметры сохраняются в **глобальные переменные** (не в localStorage).
- Пока авторизация не пройдена — показывается только экран входа.
- **Автозаполнение отключено**: `autoComplete="off"`, `autoCapitalize="off"`, `autoCorrect="off"`, `spellCheck={false}` на обоих полях.
- **Поле `apiTokenInstance`** — тип `password` с кнопкой-иконкой (Eye/EyeOff) для переключения видимости токена.

### 2.2. Основной экран

- **Слева** — сайдбар со списком чатов (ширина 320px на десктопе, 100% на мобильных).
- **Справа** — область открытого чата. Пока чат не открыт — показывается заглушка:
  - если чатов нет — «Создайте чат, чтобы начать общение»;
  - если чаты есть — «Выберите чат, чтобы начать общение».
- Список чатов **пустой** при старте — чаты создаются **только вручную** пользователем (автосоздание из входящих отключено).

### 2.3. Создание чата

- Кнопка **«Новый чат»** в шапке сайдбара.
- Открывает **модальное окно** с одним полем ввода.
- Пользователь вводит **номер телефона** (никнеймы не поддерживаются).
- Валидация: поле не пустое, значение должно совпадать с regex `/^\+?[\d\s()-]{7,20}$/`.
- Новый чат добавляется **в начало списка** и сразу открывается.
- Имя нового чата — сам номер телефона.
- `chatId` для Green API формируется из номера: убираются все нецифровые символы, `8` в начале заменяется на `7`, добавляется суффикс `@c.us` (например, `+7 900 000-00-00` → `79000000000@c.us`).

### 2.4. Чат

- В шапке: аватар (инициалы на цветном фоне), имя (номер телефона), статус (`lastSeen` / `chatId`).
- История сообщений: пузыри, входящие слева (белые/карточные), исходящие справа (зелёные в светлой теме, фиолетовые в тёмной).
- Время сообщения — под текстом, мелким шрифтом.
- Статус исходящего сообщения:
  - `sending` — одна галочка (Check)
  - `sent` — две галочки (CheckCheck)
  - `error` — надпись «Не отправлено» (красным), при наведении — текст ошибки
- Отправка: поле ввода + кнопка-иконка (Send). Отправка по Enter или клику.
- Пустое сообщение отправить нельзя (кнопка disabled).
- При отправке сообщение сразу добавляется в конец истории (статус `sending`), автоскролл вниз.
- После успешного ответа API — статус меняется на `sent`, id сообщения заменяется на `idMessage` из ответа.
- При ошибке — статус `error`, текст ошибки сохраняется в сообщении.

### 2.5. Прочитанные / непрочитанные сообщения

- Непрочитанным считается **только** то, что пришло, когда чат **закрыт**: `unreadCount` инкрементируется, только если чат не активен в момент получения.
- Если чат **открыт** — сообщение добавляется без изменения счётчика.
- Поле `Message.unread` всегда `false` при создании входящего (разделитель «Непрочитанное» в чате фактически не отображается, но логика рендера сохранена).
- **Сайдбар**: при наличии непрочитанных — круглый синий бейдж со счётчиком (`unreadCount`) в правой части превью чата. Имя чата выделено жирным.
- При выборе чата (`handleSelectChat`) `unreadCount` сбрасывается в 0, все сообщения с `unread: true` помечаются как прочитанные — бейдж исчезает.

### 2.6. Темы

- **Тёмная** и **светлая** темы.
- Выбор сохраняется в **localStorage** (ключ `tg-theme`).
- При первом запуске — берётся системная тема (`prefers-color-scheme`).
- Переключатель — иконка Sun/Moon в шапке сайдбара.
- Тема применяется через класс `.dark` на `<html>`.

### 2.7. Мобильная адаптация

- **Мобильные (до 768px / `md`):**
  - Сайдбар занимает **всю ширину** экрана.
  - Область чата (`<main>`) скрыта (`hidden md:flex`).
  - При открытии чата он рендерится как **полноэкранный оверлей** (`fixed inset-0 z-40`) поверх сайдбара.
  - В шапке чата появляется кнопка **«Назад»** (стрелка ArrowLeft), которая закрывает чат и возвращает к списку.
- **Десктоп (md и выше):**
  - Сайдбар 320px слева, чат справа.
  - Кнопка «Назад» скрыта (`md:hidden`).

## 3. Структура файлов

```
src/
├── App.tsx                      # Корневой компонент: auth → main layout, состояние чатов, отправка, long polling
├── main.tsx                     # Точка входа React
├── index.css                    # Tailwind v4 + CSS-переменные тем (shadcn)
├── types.ts                     # Типы: Chat, Message, MessageStatus
├── lib/
│   ├── utils.ts                 # cn() — clsx + tailwind-merge
│   ├── theme.ts                 # getInitialTheme, applyTheme, Theme
│   ├── credentials.ts           # Глобальные idInstance, apiTokenInstance
│   └── greenApi.ts              # Клиент Green API: sendMessage, setSettings, receiveNotification, deleteNotification
├── components/
│   ├── AuthScreen.tsx           # Экран входа (idInstance + apiTokenInstance, показ пароля)
│   ├── Sidebar.tsx              # Сайдбар: шапка + список чатов + счётчик непрочитанных
│   ├── ChatView.tsx             # Открытый чат: шапка, сообщения, разделитель «Непрочитанное», ввод, статусы
│   ├── CreateChatDialog.tsx     # Модальное окно создания чата (только телефон)
│   ├── ThemeToggle.tsx          # Кнопка переключения темы
│   ├── AvatarWithInitials.tsx   # Аватар с инициалами
│   └── ui/                      # shadcn/ui компоненты
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── avatar.tsx
│       ├── scroll-area.tsx
│       └── separator.tsx
```

## 4. Ключевые детали реализации

### 4.1. Глобальные переменные (credentials)

- Файл: `src/lib/credentials.ts`
- `let idInstance: string | null = null` и `let apiTokenInstance: string | null = null` — **модульные** (не window) переменные.
- `setCredentials(id, token)` — вызывается при успешной авторизации.
- `getCredentials()` — getter, используется в `greenApi.ts` при отправке.
- **Не сохраняются в localStorage** — только в памяти.

### 4.2. Green API клиент

- Файл: `src/lib/greenApi.ts`
- `API_URL = "https://4100.api.green-api.com"` — базовый URL API.
- `sendMessage(params)` — POST-запрос на `${API_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`.
  - Тело запроса: `{ chatId, message }` (опционально `quotedMessageId`, `typingTime`, `typingType`).
  - Ответ: `{ idMessage: string }`.
- `setSettings()` — POST-запрос на `${API_URL}/waInstance${idInstance}/setSettings/${apiTokenInstance}`.
  - Тело: `{ webhookUrl: "", outgoingWebhook: "yes", incomingWebhook: "yes" }`.
  - Ответ: `{ saveSettings: true }`.
- `receiveNotification(seconds = 5)` — GET-запрос на `${API_URL}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=${seconds}`.
  - `seconds` — таймаут ожидания, от 5 до 60 секунд.
  - Ответ: `{ receiptId: number, body: IncomingNotificationBody }` или **`null`** (очередь пуста).
  - При `null` ошибка **не выбрасывается** — возвращается `null`.
- `deleteNotification(receiptId)` — DELETE-запрос на `${API_URL}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`.
  - Ответ: `{ result: boolean, reason: string }`.
- `GreenApiError` — кастомный класс ошибки с полем `status` (HTTP-код).
- Обработка ошибок:
  - Нет соединения → «Не удалось подключиться к Green API. Проверьте сеть.»
  - HTTP-ошибка → текст из поля `message` ответа или `HTTP {status}`.
  - Некорректный ответ → соответствующее сообщение об ошибке.

### 4.3. Отправка сообщений (App.tsx)

- `handleSendMessage(chatId, text)`:
  1. Создаёт сообщение с временным id и статусом `sending`, добавляет в чат.
  2. Вызывает `sendMessage({ chatId: chat.chatId, message: text })`.
  3. При успехе — заменяет временный id на `idMessage` из ответа, статус `sent`.
  4. При ошибке — статус `error`, текст ошибки в `message.error`.
- `toGreenApiChatId(phone)` — нормализация номера телефона в формат `7XXXXXXXXXX@c.us`.

### 4.4. Получение входящих сообщений (App.tsx)

- Цикл long polling в `useEffect` (зависимость: `authed`):
  1. `receiveNotification(30)` — long polling с таймаутом 30 секунд.
  2. Если ответ `null` — очередь пуста, цикл продолжается без ошибки и без паузы.
  3. При получении уведомления с `typeWebhook === "incomingMessageReceived"`:
     - `toIncomingChatId(typeInstance, senderData)` — формирует `chatId` для Green API (Messenger — `chatId` из `senderData`, WhatsApp — `senderPhoneNumber@c.us`).
     - `extractIncomingText(messageData)` — извлекает текст из `textMessageData`, возвращает `null` для не-текстовых сообщений.
     - Если текст извлечён:
       - Создаётся `Message` (`isOutgoing: false`, `timestamp * 1000`, `unread: false`).
       - `setChats` — ищет чат по `chatId` **или** по `senderPhoneNumber` (формат `{senderPhoneNumber}@c.us`):
         - Если найден — добавляет сообщение в конец; `unreadCount` инкрементируется, только если чат **не активен** (`activeChatIdRef.current !== existing.id`).
         - Если не найден — **игнорируется** (автосоздание чатов отключено, `return prev`).
  4. `deleteNotification(receiptId)` — удаляет уведомление из очереди.
  5. При ошибке — `console.error` + пауза 3 секунды перед повтором.
- Остановка цикла: `cancelled = true` в cleanup-функции `useEffect`.
- `activeChatIdRef` — ref, синхронизируемый через `useEffect`, для определения активного чата внутри async-цикла.

### 4.5. Прочитанные / непрочитанные сообщения

- `handleSelectChat(id)`:
  1. `setActiveChatId(id)`.
  2. `setChats` — для выбранного чата: `unreadCount: 0`, все сообщения с `unread: true` → `unread: false`.
- **Sidebar**: бейдж со счётчиком (`chat.unreadCount`) отображается при `unreadCount > 0`. Имя чата — `font-semibold` при непрочитанных.
- **ChatView**: разделитель «Непрочитанное» — перед первым сообщением с `unread: true`, если предыдущее сообщение не `unread` (логика рендера сохранена; при текущей политике `unread` всегда `false`, разделитель не показывается).

### 4.6. Темы

- Файл: `src/lib/theme.ts`
- Ключ localStorage: `tg-theme`
- `getInitialTheme()` — читает localStorage, если пусто — `prefers-color-scheme`.
- `applyTheme(theme)` — добавляет/удаляет класс `.dark` на `document.documentElement` + пишет в localStorage.
- В `App.tsx` вызывается `applyTheme(getInitialTheme())` **до первого рендера** (на уровне модуля).
- `ThemeToggle` — useState + useEffect, переключает тему.

### 4.7. Tailwind v4 + shadcn/ui

- Tailwind v4 (CSS-first, без `tailwind.config.js`).
- `@import "tailwindcss"` + `@import "tw-animate-css"` в `index.css`.
- `@custom-variant dark (&:is(.dark *));` — тёмная тема через класс.
- CSS-переменные shadcn (oklch) в `:root` и `.dark`.
- `@theme inline` — маппинг переменных на Tailwind-токены.
- Vite-плагин: `@tailwindcss/vite` в `vite.config.ts`.
- Alias `@` → `./src` (через `import.meta.dirname`).

### 4.8. shadcn/ui компоненты

- Установлены через CLI: `button`, `input`, `dialog`, `avatar`, `scroll-area`, `separator`.
- **Важно:** CLI создал файлы в папке `@/` (буквально), они были **перемещены** в `src/components/ui/`.
- Импорт `cn` в shadcn-компонентах исправлен с `from "cn"` на `from "@/lib/utils"`.
- В `button.tsx` добавлен `cursor-pointer` в базовый класс.
- В `button.tsx` есть `eslint-disable-next-line react-refresh/only-export-components` для экспорта `buttonVariants`.

### 4.9. Типы

- Файл: `src/types.ts`
- `MessageStatus`: `"sending" | "sent" | "error"`.
- `Message`: `id`, `text`, `timestamp` (number), `isOutgoing` (boolean), `status?` (MessageStatus), `error?` (string), `unread?` (boolean).
- `Chat`: `id`, `name`, `chatId` (строка в формате Green API), `avatarColor`, `lastSeen?`, `messages: Message[]`, `unreadCount: number`.

### 4.10. Состояние (App.tsx)

- `authed: boolean` — пройдена ли авторизация.
- `chats: Chat[]` — список чатов (инициализируется пустым массивом).
- `activeChatId: string | null` — id открытого чата.
- `activeChatIdRef: RefObject<string | null>` — ref для определения активного чата в async-цикле.
- `createDialogOpen: boolean` — открыто ли модальное окно.
- `handleSendMessage(chatId, text)` — асинхронная отправка через Green API.
- `handleCreateChat(phone)` — создаёт чат по номеру телефона, добавляет в начало, открывает.
- `handleSelectChat(id)` — открывает чат, помечает все входящие как прочитанные, сбрасывает `unreadCount`.

### 4.11. Мобильная адаптация (App.tsx)

- `<main>` — `hidden md:flex` (скрыт на мобильных).
- Мобильный оверлей: `{activeChat && <div className="fixed inset-0 z-40 flex flex-col md:hidden">...}`.
- `ChatView` принимает опциональный `onBack` — на мобильных передаётся `() => setActiveChatId(null)`.
- Кнопка «Назад» в `ChatView` — `md:hidden`.

### 4.12. Стили в стиле Messenger Web

- Фирменный синий: `#3390ec` (кнопки, активный чат, бейдж непрочитанных, разделитель).
- Фон области чата: `#8bb0d1` (светлая) / `#0f1621` (тёмная).
- Пузыри исходящих: `#eeffde` (светлая) / `#766ac8` (тёмная).
- Пузыри входящих: `bg-card`.
- Скругление пузырей: `rounded-2xl` + `rounded-br-md` / `rounded-bl-md`.
- Заглушки: `rounded-full bg-black/20 text-white`.
- Бейдж непрочитанных: `rounded-full bg-[#3390ec] text-white` (в активном чате — `bg-white text-[#3390ec]`).
- Разделитель «Непрочитанное»: `bg-[#3390ec]/40` (линии) + `bg-[#3390ec]/10 text-[#3390ec]` (подпись).
- **Незаметный скроллбар** (глобально, `index.css`): ширина 6px, прозрачный трек и ползунок; ползунок появляется только при наведении на область прокрутки (`color-mix(in oklab, var(--foreground) 15%, transparent)`, при наведении на ползунок — 30%). Поддержка Firefox (`scrollbar-width: thin` + `scrollbar-color`) и WebKit (`::-webkit-scrollbar`).
- **Фавикон** (`public/favicon.svg`): скруглённый квадрат с градиентом `#00B2FF → #006AFF` и белым пузырём сообщения — в стиле Messenger.

## 5. Конфигурация

### 5.1. package.json

- Зависимости: `react`, `react-dom`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `radix-ui`.
- Dev: `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react`, `typescript`, `eslint`, `vite`.
- Скрипты: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`.

### 5.2. vite.config.ts

- Плагины: `react()`, `tailwindcss()`.
- Alias: `@` → `import.meta.dirname + '/src'`.

### 5.3. tsconfig.app.json

- `paths`: `@/*` → `./src/*` (без `baseUrl`).
- `noUnusedLocals`, `noUnusedParameters` — включены.
- `verbatimModuleSyntax` — включён (важно для `import type`).
- `erasableSyntaxOnly` — включён (нельзя использовать parameter properties в классах).

### 5.4. components.json (shadcn)

- style: `new-york`, tsx: true, tailwind css: `src/index.css`.
- aliases: `@/components`, `@/lib/utils`, `@/components/ui`.

## 6. Известные нюансы и потенциальные проблемы

1. **shadcn CLI создал папку `@/`** — файлы были перемещены вручную в `src/components/ui/`. При повторном запуске `npx shadcn add` может снова создать `@/`.
2. **Импорт `cn`** в shadcn-компонентах был `from "cn"` — исправлен на `from "@/lib/utils"`.
3. **`buttonVariants`** в `button.tsx` вызывает `react-refresh/only-export-components` — добавлен eslint-disable.
4. **`__dirname`** в vite.config.ts вызывал warning — заменён на `import.meta.dirname`.
5. **`App.css`** удалён (был из Vite-шаблона).
6. **`index.css`** полностью переписан (был Vite-шаблон, теперь Tailwind v4 + shadcn-токены).
7. **Глобальные переменные** — модульные, не window. При HMR Vite могут сбрасываться.
8. **`noUnusedLocals`** — если переменная объявлена, но не используется, сборка падает.
9. **`erasableSyntaxOnly`** — нельзя использовать parameter properties (`public readonly x` в конструкторе) в классах.
10. **CORS** — Green API должен разрешать запросы с домена приложения. Если CORS не настроен на стороне API, запросы из браузера будут блокироваться.
11. **Моковые данные удалены** — `src/data/mockChats.ts` больше не существует, список чатов пуст при старте.
12. **`receiveNotification` возвращает `null`** при пустой очереди — это нормальное состояние, не ошибка. Цикл long polling просто продолжает работу.
13. **Поиск чата по `senderPhoneNumber`** — при получении входящего уведомления чат ищется не только по `greenApiChatId`, но и по `{senderPhoneNumber}@c.us`, чтобы сообщения попадали в чат, созданный пользователем вручную по номеру телефона.
14. **Автосоздание чатов отключено** — входящее уведомление от неизвестного отправителя игнорируется (чат не создаётся). Чаты создаются только вручную через «Новый чат».
15. **Непрочитанные только при закрытом чате** — `unreadCount` инкрементируется, только если чат не активен в момент получения; поле `Message.unread` всегда `false` при создании входящего.

## 7. Что делать дальше (API)

- Реализовать получение истории сообщений (GET `/waInstance{id}/getChat/{chatId}/{token}`).
- Реализовать получение списка чатов (GET `/waInstance{id}/getChats/{token}`).
- Реализовать получение статуса инстанса (GET `/waInstance{id}/getStatus/{token}`).
- Реализовать отмену отправки / удаление сообщений.
- Реализовать отправку медиа (фото, документы, голосовые).
- Отображать не-текстовые входящие сообщения (фото, документы, голосовые).

## 8. Команды

```bash
npm run dev      # dev-сервер
npm run build    # tsc -b && vite build
npm run lint     # eslint
npm run preview  # preview production build
```
