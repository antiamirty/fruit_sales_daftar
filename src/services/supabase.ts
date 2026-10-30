import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STATE_ID = 'main';

export async function fetchRemoteState(): Promise<unknown | null> {
  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('id', STATE_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? data.data : null;
}

export async function saveRemoteState(state: unknown): Promise<void> {
  const { error } = await supabase
    .from('app_state')
    .upsert({ id: STATE_ID, data: state, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
