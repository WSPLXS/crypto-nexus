import { createClient } from '@supabase/supabase-js'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateRates() {
  console.log('🔄 Обновляю курсы...')
  
  const {  data: rates, error } = await supabase.from('crypto_rates').select('*')
  
  if (error) {
    console.error('❌ Ошибка Supabase:', error)
    return { success: false, error: error.message }
  }
  
  if (!rates || rates.length === 0) {
    console.error('❌ Таблица crypto_rates пуста!')
    return { success: false, message: 'No rates found' }
  }

  let updated = 0
  for (const rate of rates) {
    const change = 1 + (Math.random() * 0.04 - 0.02)
    const newRate = Math.max(rate.rate_rub * 0.5, rate.rate_rub * change)
    
    await supabase.from('crypto_rates').update({ 
      rate_rub: newRate,
      updated_at: new Date().toISOString()
    }).eq('currency', rate.currency)
    
    updated++
    console.log(`  ${rate.currency.toUpperCase()}: ${newRate.toFixed(2)} ₽`)
  }
  
  console.log(`✅ Обновлено ${updated} курсов!`)
  return { success: true, updated }
}

// Запускаем сразу при старте
updateRates()

// Сервер для health check
app.get('/', (req, res) => res.json({ 
  status: 'ok', 
  message: 'Crypto Rates Updater is running!',
  lastUpdate: new Date().toISOString()
}))

app.get('/update', async (req, res) => {
  const result = await updateRates()
  res.json(result)
})

app.listen(PORT, () => console.log(`Server on port ${PORT}`))