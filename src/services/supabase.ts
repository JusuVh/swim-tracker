import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niyopmsftnyicihtobwv.supabase.co';
const supabaseAnonKey = 'sb_publishable_jitH1bxcwhgQFsDPDe9rww_xVE07ssJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
