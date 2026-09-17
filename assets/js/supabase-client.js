// ============================================================
// Cliente Supabase — compartilhado por todas as páginas
// Chave pública (anon/publishable): protegida por Row Level Security,
// segura para ficar no código do site.
// ============================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://clwaotfbqwvxpykruwed.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd2FvdGZicXd2eHB5a3J1d2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDc0OTMsImV4cCI6MjEwNDM4MzQ5M30.Cw9zJU8UIkxhzjI-adNHoRTyNuGingHpTHZ6pjJBgBc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
