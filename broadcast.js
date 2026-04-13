// broadcast.js
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const MESSAGE = `🚀 <b>Открытие CryptoNexus 2.0 переносится!</b>

Подпишись на наш канал <a href="https://t.me/cryptonexusbotgame">@cryptonexusbotgame</a> чтобы следить за новостями и обновлениями!

💎 Вас ждут:
• WSP-Банк с переводами
• Бизнес-центр
• Казино
• Криптовалюты`;

async function sendToUser(userId) {
  try {
    const res = await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: MESSAGE,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function broadcast() {
  console.log('🔍 Диагностика Supabase...');
  
  // 🔎 Пробуем разные варианты запроса
  const queries = [
    { name: 'users (id)', fn: () => supabase.from('users').select('id') },
    { name: 'users (*)', fn: () => supabase.from('users').select('*') },
    { name: 'public.users', fn: () => supabase.from('public.users').select('id') },
  ];

  let users = null;
  
  for (const q of queries) {
    console.log(`   🔄 Пробую: ${q.name}...`);
    const {  data, error, count } = await q.fn();
    
    if (error) {
      console.log(`   ❌ ${q.name}: ${error.message}`);
      continue;
    }
    
    if (data && Array.isArray(data)) {
      console.log(`   ✅ ${q.name}: получено ${data.length} записей`);
      users = data;
      break;
    } else {
      console.log(`   ⚠️ ${q.name}: данные пустые или не массив`);
    }
  }

  if (!users) {
    console.error('\n❌ Не удалось получить пользователей ни одним запросом.');
    console.error('\n🔧 РЕШЕНИЕ: Отключи RLS для таблицы users');
    console.error('1. Зайди в Supabase → Table Editor → users');
    console.error('2. Нажми "Enable Row Level Security" → выключи его');
    console.error('3. Или выполни этот SQL в SQL Editor:');
    console.error('   ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
    return;
  }

  const userIds = [...new Set(users.map(u => u.id).filter(id => id && id > 0))];
  console.log(`\n👥 Найдено пользователей: ${userIds.length}`);
  
  if (userIds.length === 0) {
    console.log('⚠️ Список пуст.');
    return;
  }

  // 🚀 Рассылка
  console.log('🚀 Начинаю рассылку...');
  let sent = 0, failed = 0, blocked = 0;

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const { success, error: err } = await sendToUser(userId);

    if (success) sent++;
    else if (err?.includes('blocked') || err?.includes('Forbidden')) blocked++;
    else {
      failed++;
      console.log(`⚠️ User ${userId}: ${err}`);
    }

    if ((i + 1) % 50 === 0 || i === userIds.length - 1) {
      console.log(`⏳ ${i + 1}/${userIds.length} | ✅${sent} ❌${failed} 🚫${blocked}`);
    }

    if (i < userIds.length - 1) await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n🎉 Рассылка завершена!');
  console.log(`✅ Успешно: ${sent} | ❌ Ошибки: ${failed} | 🚫 Заблокировали: ${blocked}`);
}

broadcast();