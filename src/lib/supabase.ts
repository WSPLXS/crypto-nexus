import { createClient } from '@supabase/supabase-js'

// ⚠️ ВАЖНО: Вставь сюда свои данные из Supabase!
// Их можно найти в Supabase Dashboard -> Project Settings -> API
const supabaseUrl = 'https://jskyolkyxtjazthbmbwy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impza3lvbGt5eHRqYXp0aGJtYnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTM2MzYsImV4cCI6MjA5MTQyOTYzNn0.38Mb0j8db0Ds7j9hT6gBTqiD8u-B7NOLhHCyflKYWUU';

// ⚠️ Эта строка обязательна! Она делает переменную доступной для App.tsx
export const supabase = createClient(supabaseUrl, supabaseKey);