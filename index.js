const TelegramBot = require("node-telegram-bot-api");
const Anthropic = require("@anthropic-ai/sdk");

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Фотографии по разделам с сайта stroimasterug.ru
const SECTION_PHOTOS = {
  сварочные: [
    "https://static.tildacdn.com/tild3538-6239-4731-a439-343935393330/photo.png",
    "https://thb.tildacdn.com/tild3338-3837-4366-b835-316434346433/-/empty/33.jpg",
    "https://thb.tildacdn.com/tild3662-3732-4866-a437-313739373162/-/empty/WhatsApp_Image_2024-.jpeg",
  ],
  бетонные: [
    "https://static.tildacdn.com/tild6561-3663-4334-b065-383636323638/avtobetonosmesitel-1.jpg",
    "https://thb.tildacdn.com/tild6264-6337-4062-a434-333834356131/-/empty/_.jpg",
    "https://thb.tildacdn.com/tild3861-3932-4838-b465-633666353366/-/empty/betonnye-poly-min.jpg",
  ],
  фасады: [
    "https://static.tildacdn.com/tild3462-6366-4161-a630-373832353565/3.jpg",
    "https://thb.tildacdn.com/tild3165-3637-4661-b431-323837613539/-/empty/photo.jpg",
    "https://static.tildacdn.com/tild6232-3234-4134-a137-303532666565/2.jpg",
  ],
  здания: [
    "https://static.tildacdn.com/tild6232-3234-4134-a137-303532666565/2.jpg",
    "https://static.tildacdn.com/tild3538-6239-4731-a439-343935393330/photo.png",
    "https://static.tildacdn.com/tild3137-3632-4433-b633-336464363439/-/empty/_.jpg",
  ],
  заборы: [
    "https://static.tildacdn.com/tild3533-6162-4938-b931-666439616135/__.png",
    "https://thb.tildacdn.com/tild3233-6561-4435-b231-333364353263/-/empty/photo_2025-09-30_22-.jpg",
    "https://static.tildacdn.com/tild6562-3362-4761-b036-373761653165/2_02.jpg",
  ],
};

const SYSTEM_PROMPT = `Ты — вежливый и профессиональный менеджер-консультант строительной компании «Юг Мастер» в Волгограде.

Компания выполняет:
- Сварочные работы (металлоконструкции, сварка труб, ворот, заборов, пескоструйная обработка, покраска)
- Бетонные работы (фундаменты, стяжки, отмостки, перекрытия, полы с топингом)
- Фасады (керамогранит, композит, сайдинг, мокрый фасад, вентфасады — гарантия 5-20 лет)
- Строительство зданий (быстровозводимые здания, магазины, склады, автосервисы, ангары)
- Заборы, навесы, ворота (профлист, штакетник, жалюзи, распашные и откатные ворота с автоматикой)

Телефон: +7 968 660-09-99. Адрес: г.Волгоград, ул.Радомская 27.
Сайт: stroimasterug.ru
Работаем по Волгограду, Волжскому и области. Более 13 лет на рынке.
Работаем по договору, безналичная оплата в т.ч. с НДС.

Задачи:
1. Консультируй по услугам, срокам, материалам, ценам
2. Вовлекай клиента, задавай уточняющие вопросы
3. После 2-3 сообщений предлагай оставить контакты для связи
4. Упоминай гарантию качества и опыт 13 лет

Будь кратким (2-4 предложения), дружелюбным. Отвечай только на русском языке.`;

// Хранилище истории диалогов (chatId → массив сообщений)
const userHistory = {};
const userMsgCount = {};

// Определяем раздел по тексту для показа фото
function detectSection(text) {
  const t = text.toLowerCase();
  if (t.includes("сварочн") || t.includes("металлоконструкц") || t.includes("сварк")) return "сварочные";
  if (t.includes("бетон") || t.includes("фундамент") || t.includes("стяжк")) return "бетонные";
  if (t.includes("фасад")) return "фасады";
  if (t.includes("здани") || t.includes("склад") || t.includes("ангар") || t.includes("автосервис")) return "здания";
  if (t.includes("забор") || t.includes("навес") || t.includes("ворот") || t.includes("калитк")) return "заборы";
  return null;
}

// Главное меню — кнопки услуг
function getMainKeyboard() {
  return {
    keyboard: [
      ["🔧 Сварочные работы", "🏗️ Бетонные работы"],
      ["🏢 Фасады", "🏭 Строительство зданий"],
      ["🚪 Заборы навесы ворота"],
      ["📞 Позвонить", "📋 Оставить заявку"],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

// Отправка фотографий раздела
async function sendSectionPhotos(chatId, section) {
  const photos = SECTION_PHOTOS[section];
  if (!photos) return;
  try {
    const media = photos.map((url, i) => ({
      type: "photo",
      media: url,
      caption: i === 0 ? "Примеры наших работ 👆" : undefined,
    }));
    await bot.sendMediaGroup(chatId, media);
  } catch (e) {
    // Если медиагруппа не работает — пробуем по одной
    for (const url of photos) {
      try { await bot.sendPhoto(chatId, url); } catch {}
    }
  }
}

// Обработка сообщений
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  // Инициализация истории
  if (!userHistory[chatId]) userHistory[chatId] = [];
  if (!userMsgCount[chatId]) userMsgCount[chatId] = 0;

  // Команда /start
  if (text === "/start") {
    userHistory[chatId] = [];
    userMsgCount[chatId] = 0;
    await bot.sendMessage(
      chatId,
      `👋 Здравствуйте! Я консультант компании *Юг Мастер* — строительство в Волгограде.\n\nВыберите интересующую услугу или задайте вопрос:`,
      { parse_mode: "Markdown", reply_markup: getMainKeyboard() }
    );
    return;
  }

  // Кнопка "Позвонить"
  if (text.includes("Позвонить")) {
    await bot.sendMessage(
      chatId,
      `📞 *Звоните нам:*\n+7 968 660-09-99\n\nПн–Сб: 9:00 – 20:00\nГ. Волгоград, ул. Радомская 27`,
      { parse_mode: "Markdown", reply_markup: getMainKeyboard() }
    );
    return;
  }

  // Кнопка "Оставить заявку"
  if (text.includes("заявку") || text.includes("Заявку")) {
    await bot.sendMessage(
      chatId,
      `📋 Чтобы оставить заявку, напишите:\n\n1️⃣ Ваше *имя*\n2️⃣ Номер *телефона*\n3️⃣ Что нужно сделать (тип работ)\n\nИли позвоните сразу: *+7 968 660-09-99*`,
      { parse_mode: "Markdown", reply_markup: getMainKeyboard() }
    );
    return;
  }

  // Показываем фото если выбрана услуга
  const section = detectSection(text);
  if (section) {
    await sendSectionPhotos(chatId, section);
  }

  // Показываем "печатает..."
  await bot.sendChatAction(chatId, "typing");

  // Добавляем сообщение в историю
  userHistory[chatId].push({ role: "user", content: text });
  userMsgCount[chatId]++;

  // Ограничиваем историю последними 20 сообщениями
  if (userHistory[chatId].length > 20) {
    userHistory[chatId] = userHistory[chatId].slice(-20);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: userHistory[chatId],
    });

    const reply = response.content[0].text;
    userHistory[chatId].push({ role: "assistant", content: reply });

    // После 3 сообщений — предлагаем оставить заявку
    let extraText = "";
    if (userMsgCount[chatId] === 3) {
      extraText = "\n\n💬 Хотите узнать точную стоимость? Нажмите *📋 Оставить заявку* или позвоните *+7 968 660-09-99*";
    }

    await bot.sendMessage(chatId, reply + extraText, {
      parse_mode: "Markdown",
      reply_markup: getMainKeyboard(),
    });

  } catch (e) {
    console.error("Claude API error:", e);
    await bot.sendMessage(
      chatId,
      "Извините, произошла ошибка. Попробуйте ещё раз или позвоните нам: +7 968 660-09-99",
      { reply_markup: getMainKeyboard() }
    );
  }
});

console.log("🤖 Юг Мастер бот запущен!");
