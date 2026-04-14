async function updateRates() {
  console.log('🔄 Обновляю курсы...')
  
  const { data: rates, error } = await supabase.from('crypto_rates').select('*')
  
  if (error) {
    console.error('❌ Ошибка Supabase:', error)
    return { success: false, error: error.message }
  }
  
  if (!rates || rates.length === 0) {
    console.error('❌ Таблица crypto_rates пуста или не существует!')
    return { success: false, message: 'No rates found' }
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