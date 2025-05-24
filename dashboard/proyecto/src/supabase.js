import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ysrqsclhgfmhxmyvdxbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzcnFzY2xoZ2ZtaHhteXZkeGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0Mzk4MDcsImV4cCI6MjA2MzAxNTgwN30.ITqGS2_EA6v2CiNdiG3_U65Yr8RllLBi91pDQ4Ubm88';
export const supabase = createClient(supabaseUrl, supabaseKey);