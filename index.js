const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Логотип компании (хранится в этом же репозитории на GitHub)
const LOGO_URL = "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF.jpg";

// Фотографии по разделам
const PHOTOS = {
  сварочные: [
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/photos/svarka-lestnica.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/photos/svarka-lift.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/photos/svarka-naves.jpg",
  ],
  бетонные: [],
  фасады: [],
  здания: [
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/photos/zdaniya-pyaterochka.jpg",
  ],
  заборы: [],
};

// Ответы по разделам
const ANSWERS = {
  сварочные: `🔧 *Сварочные работы — Юг Мастер*

Выполняем все виды сварочных и монтажных работ:

• Металлоконструкции любой сложности
• Ворота распашные и откатные
• Заборы из профтрубы
• Навесы и козырьки
• Каркасы зданий и ангаров
• Лестницы, перила, пандусы
• Пескоструйная обработка металла
• Покраска безвоздушным аппаратом

✅ Собственное производство — цены ниже рынка
✅ Более 13 лет опыта
✅ Работаем по договору`,

  бетонные: `🏗️ *Бетонные работы — Юг Мастер*

Выполняем все виды бетонных и монолитных работ:

• Ленточный фундамент, плита, ростверк
• Стяжка пола, полусухая стяжка
• Полы с топингом (промышленные)
• Отмостка, подпорные стены
• Чаши под бассейны
• Заливка перекрытий
• Земляные работы, выемка грунта
• Тёплые полы

✅ Работаем с миксером и бетононасосом
✅ Оплата наличный/безналичный, НДС
✅ Гарантия на все работы`,

  фасады: `🏢 *Фасадные работы — Юг Мастер*

Все виды фасадов под ключ:

• Вентилируемый фасад (керамогранит, композит, металлокассеты)
• Мокрый фасад (утепление + штукатурка)
• Сайдинг (оцинкованный, пластиковый)
• Клинкерная плитка и панели
• Комбинированные фасады
• Собственное производство кассет из композита на ЧПУ

✅ Гарантия качества от 5 до 20 лет
✅ Более 200 выполненных фасадов
✅ Более 13 лет на рынке`,

  здания: `🏭 *Строительство зданий — Юг Мастер*

Строим быстровозводимые здания под ключ:

• Магазины и торговые центры
• Склады и распределительные центры
• Автосервисы и автомойки
• Производственные цеха и ангары
• Спортивные залы
• Сельскохозяйственные здания

Этапы строительства:
1️⃣ Фундамент
2️⃣ Металлокаркас
3️⃣ Сэндвич-панели / кровля
4️⃣ Фасад и полы

✅ Работаем по вашему проекту или делаем сами
✅ Прозрачная смета, фиксированная цена
✅ Безналичная оплата с НДС`,

  заборы: `🚪 *Заборы, навесы, ворота — Юг Мастер*

Изготавливаем и монтируем под ключ:

*Заборы:*
• Профлист, штакетник, жалюзи
• Дерево, композит, 3D-заборы
• Ленточный фундамент под забор
• Бурение и бетонирование столбов

*Ворота и калитки:*
• Распашные ворота
• Откатные ворота с автоматикой
• Калитки с врезными замками
• Установка домофонов

*Навесы:*
• Навесы для автомобилей
• Гаражи и боксы из сэндвич-панелей
• Беседки и барбекю-зоны

✅ Любой размер и цвет
✅ Выезд замерщика бесплатно`,
};

// Состояния пользователей для сбора заявки
const userState = {};

// Главное меню
function mainKeyboard() {
  return {
    keyboard: [
      ["🔧 Сварочные работы", "🏗️ Бетонные работы"],
      ["🏢 Фасады", "🏭 Строительство зданий"],
      ["🚪 Заборы навесы ворота"],
      ["📞 Позвонить", "📋 Оставить заявку"],
    ],
    resize_keyboard: true,
  };
}

// Отправка фото галереи
async function sendPhotos(chatId, key) {
  const photos = PHOTOS[key];
  if (!photos || photos.length === 0) return;
  if (photos.length === 1) {
    try { await bot.sendPhoto(chatId, photos[0]); } catch {}
    return;
  }
  try {
    await bot.sendMediaGroup(chatId, photos.map(url => ({ type: "photo", media: url })));
  } catch {
    for (const url of photos) {
      try { await bot.sendPhoto(chatId, url); } catch {}
    }
  }
}

// Обработка сообщений
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const state = userState[chatId] || {};

  // --- Сбор заявки (многошаговый диалог) ---
  if (state.step === "name") {
    userState[chatId] = { step: "phone", name: text };
    await bot.sendMessage(chatId, `Отлично, *${text}*! 👍\n\nТеперь напишите ваш номер телефона:`, {
      parse_mode: "Markdown",
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  if (state.step === "phone") {
    userState[chatId] = { step: "type", name: state.name, phone: text };
    await bot.sendMessage(chatId, `📱 Номер записан!\n\nЧто нужно сделать? Опишите кратко тип работ:`, {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          ["Сварочные работы", "Бетонные работы"],
          ["Фасад", "Строительство здания"],
          ["Забор/ворота/навес"],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  if (state.step === "type") {
    const { name, phone } = state;
    userState[chatId] = {};

    // Уведомление менеджеру
    const managerChatId = process.env.MANAGER_CHAT_ID;
    const leadText = `🔔 *НОВАЯ ЗАЯВКА — Юг Мастер*\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n🔧 Работы: ${text}\n\n_Источник: Telegram бот @UgMaster134bot_`;
    if (managerChatId) {
      try { await bot.sendMessage(managerChatId, leadText, { parse_mode: "Markdown" }); } catch {}
    }

    await bot.sendMessage(
      chatId,
      `✅ *Заявка принята!*\n\n${name}, наш менеджер свяжется с вами по номеру *${phone}* в течение 15 минут.\n\nЕсли срочно — звоните сами: *+7 968 660-09-99*`,
      { parse_mode: "Markdown", reply_markup: mainKeyboard() }
    );
    return;
  }

  // --- Основная навигация ---

  if (text === "/start" || text === "🏠 Главное меню") {
    userState[chatId] = {};
    try {
      await bot.sendPhoto(chatId, LOGO_URL, {
        caption: `👋 Здравствуйте! Я консультант компании *Юг Мастер* — строительство в Волгограде.\n\n🏗️ Более 13 лет на рынке\n📍 г. Волгоград, ул. Радомская 27\n\nВыберите интересующую услугу:`,
        parse_mode: "Markdown",
        reply_markup: mainKeyboard(),
      });
    } catch {
      await bot.sendMessage(
        chatId,
        `👋 Здравствуйте! Я консультант компании *Юг Мастер* — строительство в Волгограде.\n\n🏗️ Более 13 лет на рынке\n📍 г. Волгоград, ул. Радомская 27\n\nВыберите интересующую услугу:`,
        { parse_mode: "Markdown", reply_markup: mainKeyboard() }
      );
    }
    return;
  }

  if (text.includes("Сварочные")) {
    await sendPhotos(chatId, "сварочные");
    await bot.sendMessage(chatId, ANSWERS.сварочные, { parse_mode: "Markdown", reply_markup: mainKeyboard() });
    return;
  }

  if (text.includes("Бетонные")) {
    await sendPhotos(chatId, "бетонные");
    await bot.sendMessage(chatId, ANSWERS.бетонные, { parse_mode: "Markdown", reply_markup: mainKeyboard() });
    return;
  }

  if (text.includes("Фасад")) {
    await sendPhotos(chatId, "фасады");
    await bot.sendMessage(chatId, ANSWERS.фасады, { parse_mode: "Markdown", reply_markup: mainKeyboard() });
    return;
  }

  if (text.includes("Строительство")) {
    await sendPhotos(chatId, "здания");
    await bot.sendMessage(chatId, ANSWERS.здания, { parse_mode: "Markdown", reply_markup: mainKeyboard() });
    return;
  }

  if (text.includes("Забор") || text.includes("навес") || text.includes("ворот")) {
    await sendPhotos(chatId, "заборы");
    await bot.sendMessage(chatId, ANSWERS.заборы, { parse_mode: "Markdown", reply_markup: mainKeyboard() });
    return;
  }

  if (text.includes("Позвонить")) {
    await bot.sendMessage(
      chatId,
      `📞 *Звоните нам прямо сейчас:*\n\n+7 968 660-09-99\n\n🕐 Пн–Сб: 9:00 – 20:00\n📍 г. Волгоград, ул. Радомская 27\n🌐 stroimasterug.ru`,
      { parse_mode: "Markdown", reply_markup: mainKeyboard() }
    );
    return;
  }

  if (text.includes("заявку") || text.includes("Заявку")) {
    userState[chatId] = { step: "name" };
    await bot.sendMessage(
      chatId,
      `📋 Оставим заявку за 1 минуту!\n\nКак вас зовут?`,
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  // Если пользователь отправил фото без узнаваемого текста
  if (msg.photo && !text) {
    await bot.sendMessage(
      chatId,
      `Спасибо за фото! 📸 Если хотите узнать стоимость по объекту — оставьте заявку, и наш специалист всё посчитает.`,
      { parse_mode: "Markdown", reply_markup: mainKeyboard() }
    );
    return;
  }

  // Любое другое сообщение
  await bot.sendMessage(
    chatId,
    `Выберите интересующую услугу в меню ниже или позвоните нам: *+7 968 660-09-99*`,
    { parse_mode: "Markdown", reply_markup: mainKeyboard() }
  );
});

console.log("🤖 Юг Мастер бот запущен (без AI)!");
