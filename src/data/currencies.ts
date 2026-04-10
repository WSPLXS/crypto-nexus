import type { Currency } from '../types';

const getImageUrl = (filename: string) => `/currencies/${filename}`;

export const currencies: Currency[] = [
  // Дешевые (Быстрый старт)
  { id: 'mxc', name: 'Maxcoin', shortName: 'MXC', price: 50, incomePerSecond: 1.2, icon: 'M', imageUrl: getImageUrl('mxc.png'), category: 'main' },
  { id: 'vkc', name: 'VKcoin', shortName: 'VKC', price: 200, incomePerSecond: 4.5, icon: 'В', imageUrl: getImageUrl('vkc.png'), category: 'main' },
  { id: 'itdc', name: 'ITDcoin', shortName: 'ITDC', price: 800, incomePerSecond: 18, icon: 'I', imageUrl: getImageUrl('itdc.png'), category: 'main' },
  
  // Средние
  { id: 'andc', name: 'Androcoin', shortName: 'ANDC', price: 3500, incomePerSecond: 75, icon: '🤖', imageUrl: getImageUrl('andc.png'), category: 'main' },
  { id: 'iosc', name: 'IOScoin', shortName: 'IOSC', price: 8000, incomePerSecond: 160, icon: '🍎', imageUrl: getImageUrl('iosc.png'), category: 'main' },
  { id: 'inc', name: 'Instacoin', shortName: 'INC', price: 15000, incomePerSecond: 300, icon: '📸', imageUrl: getImageUrl('inc.png'), category: 'main' },
  { id: 'ttc', name: 'TikTokcoin', shortName: 'TTC', price: 30000, incomePerSecond: 550, icon: '🎵', imageUrl: getImageUrl('ttc.png'), category: 'main' },
  
  // Дорогие
  { id: 'ytc', name: 'Youtubecoin', shortName: 'YTC', price: 75000, incomePerSecond: 1200, icon: '▶', imageUrl: getImageUrl('ytc.png'), category: 'main' },
  { id: 'btc', name: 'Bitcoin', shortName: 'BTC', price: 150000, incomePerSecond: 2500, icon: '₿', imageUrl: getImageUrl('btc.png'), category: 'main' },
  { id: 'yxc', name: 'Yandexcoin', shortName: 'YXC', price: 500000, incomePerSecond: 8000, icon: 'Я', imageUrl: getImageUrl('yxc.png'), category: 'main' },
  
  { id: 'divider', name: '🔥 МЕМ КОЙНЫ', shortName: '', price: 0, incomePerSecond: 0, icon: '', imageUrl: '', category: 'meme' },
  
  // Мемные (Чуть выше доход, чуть выше риск)
  { id: 'tatw', name: 'Tatwole', shortName: 'TATW', price: 600, incomePerSecond: 12, icon: 'T', imageUrl: getImageUrl('tatw.png'), category: 'meme' },
  { id: 'peka', name: 'minipeka', shortName: 'PEKA', price: 1500, incomePerSecond: 28, icon: '🐹', imageUrl: getImageUrl('peka.png'), category: 'meme' },
  { id: 'gzn', name: 'Gazan', shortName: 'GZN', price: 4000, incomePerSecond: 70, icon: 'G', imageUrl: getImageUrl('gzn.png'), category: 'meme' },
  { id: 'avs', name: 'Aviasales', shortName: 'AVS', price: 9000, incomePerSecond: 140, icon: '✈', imageUrl: getImageUrl('avs.png'), category: 'meme' },
  { id: 'zolo', name: 'IvanZolo', shortName: 'ZOLO', price: 18000, incomePerSecond: 260, icon: 'Z', imageUrl: getImageUrl('zolo.png'), category: 'meme' },
  { id: 'evln', name: 'Evelone', shortName: 'EVLN', price: 35000, incomePerSecond: 500, icon: 'E', imageUrl: getImageUrl('evln.png'), category: 'meme' },
  { id: 'bstr', name: 'Buster', shortName: 'BSTR', price: 65000, incomePerSecond: 900, icon: 'B', imageUrl: getImageUrl('bstr.png'), category: 'meme' },
  { id: 'rvsn', name: 'Ravshan', shortName: 'RVSN', price: 120000, incomePerSecond: 1600, icon: 'R', imageUrl: getImageUrl('rvsn.png'), category: 'meme' },
  { id: 'mc', name: 'Memecoin', shortName: 'MC', price: 250000, incomePerSecond: 3500, icon: '🐸', imageUrl: getImageUrl('mc.png'), category: 'meme' },
  { id: 'nkgl', name: 'Nekoglai', shortName: 'NKGL', price: 450000, incomePerSecond: 6000, icon: '🐱', imageUrl: getImageUrl('nkgl.png'), category: 'meme' },
  { id: 'lhpw', name: 'lehapawsik', shortName: 'LHPW', price: 800000, incomePerSecond: 11000, icon: '🐾', imageUrl: getImageUrl('lhpw.png'), category: 'meme' },
  { id: 'strg', name: 'Strogo', shortName: 'STRG', price: 1500000, incomePerSecond: 20000, icon: 'S', imageUrl: getImageUrl('strg.png'), category: 'meme' },
  { id: 'clkl', name: 'Cleankill', shortName: 'CLKL', price: 3000000, incomePerSecond: 40000, icon: 'C', imageUrl: getImageUrl('clkl.png'), category: 'meme' },
  { id: 'litv', name: 'Litvin', shortName: 'LITV', price: 6000000, incomePerSecond: 80000, icon: 'L', imageUrl: getImageUrl('litv.png'), category: 'meme' },
  { id: 'anar', name: 'Anar', shortName: 'ANAR', price: 12000000, incomePerSecond: 150000, icon: 'A', imageUrl: getImageUrl('anar.png'), category: 'meme' },
  { id: 'wc', name: 'WSP', shortName: 'WC', price: 20000000, incomePerSecond: 250000, icon: 'W', imageUrl: getImageUrl('wc.png'), category: 'meme' },
  { id: 'ishs', name: 'ishowspeed', shortName: 'ISHS', price: 35000000, incomePerSecond: 450000, icon: '⚡', imageUrl: getImageUrl('ishs.png'), category: 'meme' },
  { id: 'hoka', name: 'UraganHokage', shortName: 'HOKA', price: 50000000, incomePerSecond: 600000, icon: '🌪', imageUrl: getImageUrl('hoka.png'), category: 'meme' },
];