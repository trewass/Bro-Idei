# Idea Cards

Мобильное приложение на Expo/React Native для захвата идей, заметок и наблюдений голосом или текстом с последующим анализом и синхронизацией с Supabase и Obsidian.

## Запуск

```bash
npm install
npm run start
```

Приложение использует Expo Router, поэтому стартовая точка — `app/index.tsx`.

### Переменные окружения

Скопируйте `.env.example` в `.env` и задайте значения:

- `ASSEMBLYAI_API_KEY` — ключ для AssemblyAI (загрузка аудио и транскрибация).
- `SUPABASE_URL` и `SUPABASE_ANON_KEY` — параметры проекта Supabase.
- `LLM_ENDPOINT` — HTTP endpoint, который принимает системный промпт и транскрипт и возвращает JSON c анализом идеи.

## Основные директории

- `app/` — маршруты Expo Router (табы, модалки, экран карточки).
- `src/components/` — UI-компоненты (карточка, бейдж, цветная лента).
- `src/store/` — Zustand-хранилище c CRUD по карточкам.
- `src/lib/` — вспомогательные модули: SQLite, AssemblyAI, аудио, LLM, синхронизация с Supabase.
- `obsidian-plugin/` — MVP плагина для Obsidian.

## Скрипты

- `npm run start` — запуск Metro/Expo Dev Tools.
- `npm run android` / `npm run ios` — сборки под конкретные платформы.
- `npm run web` — web-версия (для отладки).
- `npm run typecheck` — проверка типов TypeScript.

## Текущий статус

- Скелет экранов и модалок.
- Создание карточки голосом или текстом, вызов транскрибации и анализа.
- Локальное хранилище SQLite с миграциями и CRUD.
- Supabase sync (push/pull + realtime-хуки).
- Экран карточки с редактированием и управлением связями.
- Папка с начальным плагином для Obsidian (см. `obsidian-plugin/README.md`).
