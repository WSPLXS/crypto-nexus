// railway-cron/index.js
import { createClient } from '@supabase/supabase-js'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

// Создаём клиент Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
)

// Функция обновления курсов
async function updateRates() {
  console.log('🔄 Обновляю курсы крипты...')
  
  const {  rates, error } = await supabase.from('crypto_rates').select('*')
  
  if (error) {
    console.error('❌ Ошибка загрузки:', error)
    return { success: false, error: error.message }
  }

  let updated = 0
  for (const rate of rates) {
    const change = 1 + (Math.random() * 0.04 - 0.02) // ±2%
    const newRate = Math.max(rate.rate_rub * 0.5, rate.rate_rub * change)
    
    await supabase.from('crypto_rates').update({ 
      rate_rub: newRate,
      updated_at: new Date().toISOString()
    }).eq('currency', rate.currency)
    
    updated++
    console.log(`  ${rate.currency.toUpperCase()}: ${rate.rate_rub.toFixed(2)} → ${newRate.toFixed(2)} ₽`)
  }
  
  console.log(`✅ Обновлено ${updated} курсов!`)
  return { success: true, updated }
}

// API endpoint для ручного запуска
app.get('/update', async (req, res) => {
  const result = await updateRates()
  res.json(result)
})

// API endpoint для проверки работы
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Crypto Rates Updater is running!',
    lastUpdate: new Date().toISOString()
  })
})

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/`)
  console.log(`🔄 Update endpoint: http://localhost:${PORT}/update`)
})