import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function startBot() {
    try {
        console.log('🔄 Удаляю старый вебхук...');
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        console.log('✅ Вебхук удалён. Перехожу в режим long polling...');

        // 1️⃣ Команда /start
bot.start(async (ctx) => {
    console.log('📥 Получен /start от:', ctx.from.id, ctx.from.first_name);
    console.log('🔍 Raw startPayload:', JSON.stringify(ctx.startPayload));
    
    const rawPayload = ctx.startPayload?.trim();
    console.log('📦 Очищенный payload:', rawPayload);

    if (!rawPayload) {
        return ctx.reply("Привет! Покупки совершай в игре. 🎮");
    }

    try {
        const parts = rawPayload.split('_');
        console.log('🔧 parts массив:', parts);
        
        const itemType = parts[1] || 'unknown';
        const currencyType = parts[2] || 'stars';
        const price = parseInt(parts[3], 10) || 15;

        const title = `Crypto-Nexus: ${itemType.toUpperCase()}`;
        console.log(`🛒 Товар: ${itemType} | Валюта: ${currencyType} | Цена: ${price}`);
        console.log(`🧾 Заголовок инвойса: "${title}"`);

        const currency = currencyType === 'stars' ? 'XTR' : 'RUB';
        const providerToken = currencyType === 'stars' ? '' : (process.env.PROVIDER_TOKEN || '');

        // 🔥 ИСПРАВЛЕНИЕ: sendInvoice вместо createInvoiceLink + replyWithInvoice
        console.log('🧾 Отправляю инвойс через sendInvoice...');
        
        await ctx.telegram.sendInvoice(ctx.chat.id, {
            title: title,
            description: `Покупка внутри игры: ${itemType}`,
            payload: JSON.stringify({ type: itemType, currency: currencyType, price, userId: ctx.from.id }),
            provider_token: providerToken,
            currency: currency,
            prices: [{ label: 'Оплата', amount: price }],
            start_parameter: `buy_${itemType}`,
            is_flexible: false
        });

        console.log('✅ Инвойс успешно отправлен!');

    } catch (err) {
        console.error('❌ Ошибка создания инвойса:', err);
        ctx.reply(`❌ Ошибка: ${err.message || err}`);
    }
});

        // 2️⃣ Подтверждение перед оплатой
        bot.on('pre_checkout_query', (ctx) => {
            console.log('💳 Pre-checkout:', ctx.preCheckoutQuery.id);
            ctx.answerPreCheckoutQuery(true);
        });

        // 3️⃣ Успешная оплата
        bot.on('successful_payment', async (ctx) => {
            console.log('💰 УСПЕШНАЯ ОПЛАТА!');
            const payment = ctx.message.successful_payment;
            const data = JSON.parse(payment.invoice_payload);
            
            console.log(`📦 Данные: ${data.type} | ${data.currency} | ${data.price} | user: ${data.userId}`);
            
            try {
                let updateData = {};
                if (data.type === 'vip') {
                    updateData = { vip_status: 'vip', balance: 5000, boost_multiplier: 1.5, boost_expires_at: new Date(Date.now() + 86400000) };
                } else if (data.type === 'platinum') {
                    updateData = { vip_status: 'platinum', balance: 100000, boost_multiplier: 2.5, boost_expires_at: new Date(Date.now() + 86400000 * 2) };
                } else if (data.type === 'premium') {
                    updateData = { vip_status: 'premium', balance: 500000, boost_multiplier: 3.0, boost_expires_at: new Date(Date.now() + 86400000 * 3) };
                } else if (data.type.includes('boost')) {
                    const multiplier = data.type.includes('x2') ? 2 : data.type.includes('x3') ? 3 : 5;
                    updateData = { boost_multiplier: multiplier, boost_expires_at: new Date(Date.now() + 86400000) };
                }

                const { error } = await supabase.from('users').update(updateData).eq('id', data.userId);
                if (error) throw error;

                ctx.reply(`✅ Спасибо! Товар "${data.type}" активирован. Бонусы начислены! 🎉`);
            } catch (err) {
                console.error('❌ Ошибка выдачи товара:', err);
                ctx.reply('⚠️ Оплата прошла, но ошибка выдачи. Напиши админу.');
            }
        });

        // 4️⃣ Запуск
        console.log('🚀 Запускаю long polling...');
        await bot.launch();
        console.log('🤖 БОТ ЗАПУЩЕН И СЛУШАЕТ СООБЩЕНИЯ!');

    } catch (err) {
        console.error('💀 КРИТИЧЕСКАЯ ОШИБКА ЗАПУСКА:', err);
        process.exit(1);
    }
}

// Корректное завершение
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Запуск
startBot();