import { CreateCashMovementInput, CashMovement, UserCurrencies } from '../lib/types/funding';
import { createClient } from '@/utils/supabase/client';

export async function createCashMovement(
  userId: string, 
  input: CreateCashMovementInput
): Promise<CashMovement> {
  const supabase = createClient();
  
  // Get user currencies first
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('home_currency')
    .eq('user_id', userId)
    .single();

  if (userError) throw userError;

  const { data: prefData, error: prefError } = await supabase
    .from('user_preferences')
    .select('default_trading_currency')
    .eq('user_id', userId)
    .single();

  if (prefError) throw prefError;

  const home_currency = userData.home_currency;
  const trading_currency = prefData.default_trading_currency || 'USD';
  
  // Calculate trading currency value
  const trading_currency_value = input.home_currency_value * input.spot_rate;
  
  const { data, error } = await supabase
    .from('cash_movements')
    .insert({
      user_id: userId,
      home_currency_code: home_currency,
      home_currency_value: input.home_currency_value,
      trading_currency_code: trading_currency,
      trading_currency_value: trading_currency_value,
      spot_rate: input.spot_rate,
      direction_id: input.direction_id,
      transaction_date: input.transaction_date,
      period_from: input.period_from || null,
      period_to: input.period_to || null,
      notes: input.notes || null
    })
    .select()
    .single();

  if (error) throw error;
  
  return data;
}