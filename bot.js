require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

// 1. Настройки
const BOT_TOKEN = process.env.BOT_TOKEN; // Твой токен бота
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const bot = new Telegraf(BOT_TOKEN);

// 2. Обработка кнопки "Start"
bot.start((ctx) => {
    // Если ссылка имеет вид t.me/bot?start=buy_vip_stars_15
    const payload = ctx.startPayload;
    if (payload) {
        handlePurchase(ctx, payload);
    } else {
        ctx.reply("Привет! Я бот для Crypto-Nexus. Покупки совершай в игре! 🎮");
    }
});

// 3. Логика покупки
async function handlePurchase(ctx, payload) {
    // payload пример: "buy_vip_rub_50" или "buy_boost_x2_stars_15"
    const parts = payload.split('_'); 
    // parts: ['buy', 'vip', 'rub', '50']
    
    const itemType = parts[1]; // vip, platinum, premium, boost_x2...
    const currencyType = parts[2]; // rub, stars
    let price = parseInt(parts[3]); // 50, 15, etc.

    // Настройка товара
    let title = "Товар";
    let description = "Покупка в Crypto-Nexus";
    let currency = currencyType === 'stars' ? 'XTR' : 'RUB';
    
    // Для рублей цена должна быть в копейках (умножаем на 100)
    let finalPrice = currencyType === 'rub' ? price * 100 : price;

    // Названия товаров
    if (itemType === 'vip') { title = 'VIP Status'; description = '+5000$, Бейдж, Буст x1.5 (1 день)'; }
    if (itemType === 'platinum') { title = 'PLATINUM VIP'; description = '+100,000$, Бейдж, Буст x2.5 (2 дня)'; }
    if (itemType === 'premium') { title = 'PREMIUM VIP'; description = '+500,000$, Бейдж, Буст x3.0 (3 дня)'; }
    if (itemType.startsWith('boost')) { 
        const days = parts[4] || 1; 
        title = `Буст x${itemType.split('x')[1]} на ${days} дн.`; 
        description = `Усиление дохода в игре`;
    }

    // Создаем ссылку на оплату
    try {
        const link = await ctx.telegram.createInvoiceLink({
            title: title,
            description: description,
            payload: JSON.stringify({ type: itemType, currency: currencyType, price: price, userId: ctx.from.id }),
            provider_token: currencyType === 'rub' ? process.env.PROVIDER_TOKEN : '', // Для звезд оставляем пустым!
            currency: currency,
            prices: [{ label: title, amount: finalPrice }]
        });

        ctx.replyWithInvoice(link);
    } catch (err) {
        console.error(err);
        ctx.reply("Ошибка создания оплаты 😔");
    }
}

// 4. Подтверждение оплаты (Pre-checkout) - ОБЯЗАТЕЛЬНО
bot.on('pre_checkout_query', (ctx) => {
    ctx.answerPreCheckoutQuery(true);
});

// 5. Успешная оплата - ВЫДАЧА ТОВАРА
bot.on('successful_payment', async (ctx) => {
    const payment = ctx.message.successful_payment;
    const data = JSON.parse(payment.invoice_payload);
    const userId = data.userId; // ID игрока в Telegram (он же в нашей базе)
    
    console.log(`Оплата прошла! Игрок: ${userId}, Товар: ${data.type}`);

    try {
        // --- ЛОГИКА ВЫДАЧИ ТОВАРА ---
        let updateData = {};

        if (data.type === 'vip') {
            updateData = { vip_status: 'vip', balance: 5000, boost_multiplier: 1.5, boost_expires_at: new Date(Date.now() + 86400000) };
        } else if (data.type === 'platinum') {
            updateData = { vip_status: 'platinum', balance: 100000, boost_multiplier: 2.5, boost_expires_at: new Date(Date.now() + 86400000 * 2) };
        } else if (data.type === 'premium') {
            updateData = { vip_status: 'premium', balance: 500000, boost_multiplier: 3.0, boost_expires_at: new Date(Date.now() + 86400000 * 3) };
        } else if (data.type.startsWith('boost')) {
            // Тут сложная логика добавления дней к текущему бусту, пока упростим:
            // Просто ставим буст
             updateData = { boost_multiplier: 2, boost_expires_at: new Date(Date.now() + 86400000) }; 
        }

        // Обновляем БД
        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (error) throw error;

        ctx.reply(`✅ Спасибо за покупку! \nТовар "${data.type}" активирован.`);

    } catch (err) {
        console.error("Ошибка выдачи товара:", err);
        ctx.reply("Оплата прошла, но товар не выдан. Пиши в поддержку!");
    }
});

// Запуск бота
bot.launch();
console.log("Bot started...");

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));