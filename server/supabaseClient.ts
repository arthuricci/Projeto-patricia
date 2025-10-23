import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uarmuedfvqnguortykva.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcm11ZWRmdnFuZ3VvcnR5a3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTA4MDcsImV4cCI6MjA3NjQ2NjgwN30.sUpMrpkCNcCDH80WJknX-bUeK5gyB1oSVWUbPcPsZQs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Insumo {
  id: string;
  nome: string;
  unidade_base: string;
  nivel_minimo: number;
  created_at?: string;
  updated_at?: string;
}

