import { createClient } from '@supabase/supabase-js';

// Твои данные для подключения к базе
const SUPABASE_URL = 'https://vmmrrzmkdrjzgooxleoc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p0ZDvBiaB3OHf9CA-aSkBQ_URLr_Kxe';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const getTelegramUser = () => {
  // @ts-ignore
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
};