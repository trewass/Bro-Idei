# Idea Cards Sync (Obsidian Plugin)

MVP-плагин для синхронизации карточек из мобильного приложения Idea Cards с папкой в Obsidian.

## Возможности

- Настройки Supabase URL/Key, user_id и папки в Obsidian (`IdeaCards/` по умолчанию).
- Первичная загрузка заметок из Supabase и создание/обновление Markdown-файлов.
- Обратный поток: изменения локальных файлов отправляются обратно в Supabase (`notes`).
- Realtime-подписка Supabase → автоматическое обновление файлов.

## Структура Markdown-файлов

```
---
id: <uuid>
title: "..."
type: idea|note|observation
score: <0-10>
updatedAt: <ISO>
tags: [ideacards]
links: ["<id1>", "<id2>"]
---

# Заголовок
Краткое описание

## Transcript
Полный текст диктовки

## Analysis
Саммари, reasoning, suggestions
```

## Разработка

```bash
cd obsidian-plugin
npm install
npm run dev
```

Файл `manifest.json` и сборка `main.js` копируются в папку плагинов Obsidian. После изменения настроек обязательно перезапустить плагин.
