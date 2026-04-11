const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const { HttpsProxyAgent } = require('https-proxy-agent'); // <-- Добавили это

// Настройки прокси (если нужен)
const PROXY_URL = 'http://127.0.0.1:1080';

// СЮДА ВСТАВИШЬ СВОИ ДАННЫЕ ПОСЛЕ ПОЛУЧЕНИЯ
const BOT_TOKEN = '8721131915:AAH4yF3Y5NAfuZ3Fie1Qz1So538d5vBfEkc';
const SUPABASE_URL = 'https://jskyolkyxtjazthbmbwy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impza3lvbGt5eHRqYXp0aGJtYnd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg1MzYzNiwiZXhwIjoyMDkxNDI5NjM2fQ.ebRPHK9HjKyXICFs03Rcb-21sP8Xjeb67d77adL4U68';

const bot = new TelegramBot(BOT_TOKEN, { 
  polling: true,
  request: {
    agent: new HttpsProxyAgent(PROXY_URL) // <-- Прокси для запросов
  }
});
console.log('🤖 Бот запущен...');

bot.on('photo', async (msg) => {
  const userId = msg.from.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;

  try {
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    const response = await fetch(fileUrl);
    const buffer = await response.buffer();

    const fileName = `${userId}.jpg`;
    await supabase.storage.from('avatars').upload(fileName, buffer, { upsert: true });

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    
    await supabase.from('users').upsert({
      id: userId,
      custom_avatar_url: data.publicUrl,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    bot.sendMessage(userId, '✅ Готово! Перезапусти игру.');
  } catch (error) {
    console.error(error);
    bot.sendMessage(userId, '❌ Ошибка');
  }
});