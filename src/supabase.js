// ─── Supabase setup ───
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rvkzsnbykpsuhyrgeypu.supabase.co";
const SUPABASE_KEY = "sb_publishable_PkSLWBxR9YP1QrfXARRRiw_MY35Pp0O";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);