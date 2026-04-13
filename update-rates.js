// update-rates.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

// Создаём клиент Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
)

async function updateRates() {
  console.log('🔄 Обновляю курсы крипты...')
  
  // Получаем текущие курсы из базы
  const { data: rates, error } = await supabase.from('crypto_rates').select('*')
  
  if (error) {
    console.error('❌ Ошибка загрузки:', error)
    return
  }

  // Обновляем каждый курс (±2% случайное изменение)
  for (const rate of rates) {
    const change = 1 + (Math.random() * 0.04 - 0.02) // от -2% до +2%
    const newRate = Math.max(rate.rate_rub * 0.5, rate.rate_rub * change) // не ниже 50% от начального
    
    await supabase.from('crypto_rates').update({ 
      rate_rub: newRate,
      updated_at: new Date().toISOString()
    }).eq('currency', rate.currency)
    
    console.log(`  ${rate.currency.toUpperCase()}: ${rate.rate_rub.toFixed(2)} → ${newRate.toFixed(2)} ₽`)
  }
  
  console.log('✅ Курсы обновлены!')
}

updateRates()