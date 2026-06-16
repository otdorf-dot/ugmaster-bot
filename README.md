# 🤖 Telegram бот «Юг Мастер» (без AI)

Бот-консультант без внешних API — нужен только Telegram токен.

---

## 🚀 Запуск на Railway за 10 минут

### Шаг 1 — Получите новый токен у @BotFather
1. Telegram → @BotFather → `/mybots`
2. Выберите @UgMaster134bot
3. API Token → **Revoke** (отзовите старый!)
4. Скопируйте новый токен

### Шаг 2 — Загрузите на GitHub
1. Зайдите на github.com → создайте аккаунт
2. New repository → название: `ugmaster-bot` → Create
3. Загрузите файлы: `index.js` и `package.json`
   (кнопка "Add file" → "Upload files")

### Шаг 3 — Деплой на Railway
1. Зайдите на railway.app → Login with GitHub
2. New Project → Deploy from GitHub repo
3. Выберите `ugmaster-bot`

### Шаг 4 — Переменные окружения
В Railway → ваш проект → вкладка Variables → Add:

| Переменная       | Значение                        |
|------------------|---------------------------------|
| TELEGRAM_TOKEN   | токен от @BotFather             |
| MANAGER_CHAT_ID  | ваш Telegram ID (см. ниже)      |

### Как узнать свой Telegram ID (MANAGER_CHAT_ID):
Напишите боту @userinfobot — он пришлёт ваш ID (число вида 123456789)

### Шаг 5 — Готово! 🎉
Найдите @UgMaster134bot в Telegram → нажмите Start

---

## 📱 Функции бота
- Кнопки 5 услуг с фото и описанием
- Сбор заявок (имя → телефон → тип работ)
- Уведомление менеджеру при новой заявке
- Кнопка «Позвонить» с номером
- Не требует никаких платных API!

