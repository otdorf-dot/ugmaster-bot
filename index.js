const TelegramBot = require("node-telegram-bot-api");
const nodemailer = require("nodemailer");
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

// ===== Настройка отправки email через Yandex SMTP =====
const mailTransporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendLeadEmail({ name, phone, type }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    log("MAIL_USER/MAIL_PASS не настроены, письмо не отправлено.");
    return;
  }
  const contact = phone ? `${name}, ${phone}` : name;
  try {
    await mailTransporter.sendMail({
      from: `"Юг Мастер бот" <${process.env.MAIL_USER}>`,
      to: "ot.do@mail.ru",
      subject: "Заявка из телеги",
      text: `Заявка из телеги\n\nКонтакт: ${contact}\nТип работ: ${type}`,
      html: `<p><b>Заявка из телеги</b></p><p>Контакт: ${contact}<br>Тип работ: ${type}</p>`,
    });
    log(`Email с заявкой отправлен: ${contact}, ${type}`);
  } catch (err) {
    log("ОШИБКА отправки email:", err.message);
  }
}

// ===== Логотип компании =====
const LOGO_URL =
  "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/%D0%BB%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF.jpg";

// ===== Фотографии по разделам =====
const PHOTOS = {
  сварочные: [
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/svarka-lestnica.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/svarka-lift.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/svarka-naves.jpg",
  ],
  бетонные: [
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/14961_15826480751.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/2%20(2).jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/2dtggvkn92wbznsxexxpvnuw356jz3mk.jpg",
  ],
  фасады: [
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/fasad-lukoil.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/fasad-montaj-paneley.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/fasad-magazin.jpg",
  ],
  здания: [
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/zdaniya-ofis-yugmaster.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/zdaniya-kombinirovannyy.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/zdaniya-basseyn-besedka.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/zdaniya-angar.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/zdaniya-dom-basseyn.jpg",
  ],
  заборы: [
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/zabor-vorota-kirpich.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/naves-terrasa.jpg",
    "https://raw.githubusercontent.com/otdorf-dot/ugmaster-bot/main/zabor-shtaketnik.jpg",
  ],
};

// ===== Текстовые описания услуг =====
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

// ===== Состояния пользователей для сбора заявки =====
const userState = {};

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

// Отправка фото-галереи раздела с подробным логированием каждого шага
async function sendPhotos(chatId, key) {
  const photos = PHOTOS[key];
  log(`sendPhotos called for key="${key}", chatId=${chatId}, photos.length=${photos ? photos.length : "undefined"}`);

  if (!photos || photos.length === 0) {
    log(`No photos configured for "${key}", skipping.`);
    return;
  }

  if (photos.length === 1) {
    try {
      log(`Sending single photo: ${photos[0]}`);
      await bot.sendPhoto(chatId, photos[0]);
      log(`Single photo sent OK for "${key}"`);
    } catch (err) {
      log(`ERROR sending single photo for "${key}":`, err.message);
    }
    return;
  }

  try {
    log(`Attempting sendMediaGroup for "${key}" with URLs:`, photos);
    await bot.sendMediaGroup(
      chatId,
      photos.map((url) => ({ type: "photo", media: url }))
    );
    log(`sendMediaGroup OK for "${key}"`);
  } catch (err) {
    log(`ERROR in sendMediaGroup for "${key}":`, err.message);
    log(`Falling back to sending photos one by one for "${key}"`);
    for (const url of photos) {
      try {
        await bot.sendPhoto(chatId, url);
        log(`Fallback sendPhoto OK: ${url}`);
      } catch (err2) {
        log(`Fallback sendPhoto FAILED for ${url}:`, err2.message);
      }
    }
  }
}

function showLeadForm(chatId) {
  userState[chatId] = { step: "contact" };
  return bot.sendMessage(
    chatId,
    `📋 Оставим заявку за *1 минуту*!\n\nКак вас зовут?`,
    { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
  );
}

// ===== Определяем раздел по тексту кнопки =====
function detectSection(text) {
  const t = text.toLowerCase();
  if (t.includes("сварочн")) return "сварочные";
  if (t.includes("бетон")) return "бетонные";
  if (t.includes("фасад")) return "фасады";
  if (t.includes("строительство")) return "здания";
  if (t.includes("забор") || t.includes("навес") || t.includes("ворот")) return "заборы";
  return null;
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  log(`Incoming message from ${chatId}: "${text}"`);

  const state = userState[chatId] || {};

  // --- Сбор заявки ---
  if (state.step === "contact") {
    userState[chatId] = { step: "phone", name: text };
    await bot.sendMessage(
      chatId,
      `Отлично, *${text}*! 👍\n\nТеперь введите номер телефона в формате:\n*+79001234567*`,
      { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  if (state.step === "phone") {
    // Валидация: убираем пробелы/тире, проверяем формат +7XXXXXXXXXX
    const cleaned = text.replace(/[\s\-\(\)]/g, "");
    const phoneRegex = /^\+7\d{10}$/;
    if (!phoneRegex.test(cleaned)) {
      await bot.sendMessage(
        chatId,
        `❌ Номер введён неверно.\n\nВведите номер строго в формате:\n*+79001234567*\n\n_(11 цифр после +7)_`,
        { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
      );
      return;
    }
    userState[chatId] = { step: "type", name: state.name, phone: cleaned };
    await bot.sendMessage(
      chatId,
      `📱 Номер *${cleaned}* записан!\n\nЧто нужно сделать? Выберите или опишите тип работ:`,
      {
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
      }
    );
    return;
  }

  if (state.step === "type") {
    const { name, phone } = state;
    userState[chatId] = {};
    log(`New lead: name="${name}", phone="${phone}", type="${text}"`);

    // Отправляем ответ клиенту СРАЗУ
    await bot.sendMessage(
      chatId,
      `✅ *Заявка принята!*\n\n${name}, наш менеджер свяжется с вами по номеру *${phone}* в течение 15 минут.\n\nЕсли срочно — звоните сами: *+7 968 660-09-99*`,
      { parse_mode: "Markdown", reply_markup: mainKeyboard() }
    );

    // Уведомление владельцу в Telegram — основной канал получения заявок
    const managerChatId = process.env.MANAGER_CHAT_ID;
    log(`MANAGER_CHAT_ID = "${managerChatId}"`);
    if (managerChatId) {
      bot.sendMessage(
        managerChatId,
        `🔔 *НОВАЯ ЗАЯВКА — Юг Мастер*\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n🔧 Работы: ${text}\n\n_Источник: Telegram бот_`,
        { parse_mode: "Markdown" }
      )
        .then(() => log("Уведомление менеджеру отправлено успешно"))
        .catch(err => log("ОШИБКА уведомления менеджера:", err.message));
    } else {
      log("MANAGER_CHAT_ID не настроен — уведомление не отправлено!");
    }
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
    } catch (err) {
      log("Logo send failed, fallback to text:", err.message);
      await bot.sendMessage(
        chatId,
        `👋 Здравствуйте! Я консультант компании *Юг Мастер* — строительство в Волгограде.\n\n🏗️ Более 13 лет на рынке\n📍 г. Волгоград, ул. Радомская 27\n\nВыберите интересующую услугу:`,
        { parse_mode: "Markdown", reply_markup: mainKeyboard() }
      );
    }
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
    await showLeadForm(chatId);
    return;
  }

  const section = detectSection(text);
  if (section) {
    log(`Detected section "${section}" from text "${text}"`);
    await sendPhotos(chatId, section);
    await bot.sendMessage(chatId, ANSWERS[section], {
      parse_mode: "Markdown",
      reply_markup: mainKeyboard(),
    });
    return;
  }

  if (msg.photo && !text) {
    await bot.sendMessage(
      chatId,
      `Спасибо за фото! 📸 Если хотите узнать стоимость по объекту — оставьте заявку, и наш специалист всё посчитает.`,
      { parse_mode: "Markdown", reply_markup: mainKeyboard() }
    );
    return;
  }

  await bot.sendMessage(
    chatId,
    `Выберите интересующую услугу в меню ниже или позвоните нам: *+7 968 660-09-99*`,
    { parse_mode: "Markdown", reply_markup: mainKeyboard() }
  );
});

bot.on("polling_error", (err) => {
  log("POLLING ERROR:", err.message);
});

log("🤖 Юг Мастер бот запущен (v2, с подробным логированием)!");
