import { CreateCashMovementInput, CashMovement, UserCurrencies } from '../lib/types/funding';
import { createClient } from '@/utils/supabase/client';
import { CashMovementWithDirection } from '../lib/types/funding';

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

export async function getUniquePeriods(userId: string): Promise<Array<{period_from: string, period_to: string | null, period_display: string}>> {
  const supabase = createClient();
  
  const { data: movements, error } = await supabase
    .from('cash_movements')
    .select('period_from, period_to')
    .eq('user_id', userId)
    .not('period_from', 'is', null)
    .order('period_from', { ascending: true });

  if (error) throw error;

  const uniquePeriods = new Map<string, {period_from: string, period_to: string | null, period_display: string}>();
  
  movements.forEach((movement: any) => {
    const key = `${movement.period_from}|${movement.period_to}`;
    
    if (!uniquePeriods.has(key)) {
      const fromDate = new Date(movement.period_from).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
        });
      
      let periodDisplay = fromDate;
      if (movement.period_to) {
        const toDate = new Date(movement.period_to).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        periodDisplay = `${fromDate} - ${toDate}`;
      } else {
        periodDisplay = `${fromDate} - Ongoing`;
      }
      
      uniquePeriods.set(key, {
        period_from: movement.period_from,
        period_to: movement.period_to,
        period_display: periodDisplay
      });
    }
  });

  return Array.from(uniquePeriods.values());
}

export async function getMovementsForPeriod(userId: string, periodFrom: string, periodTo: string | null): Promise<CashMovementWithDirection[]> {
  const supabase = createClient();
  
  let query = supabase
    .from('cash_movements')
    .select(`
      *,
      direction:cash_movement_directions(*)
    `)
    .eq('user_id', userId)
    .eq('period_from', periodFrom);
  
  if (periodTo) {
    query = query.eq('period_to', periodTo);
  } else {
    query = query.is('period_to', null);
  }
  
  const { data, error } = await query.order('transaction_date', { ascending: false });

  if (error) throw error;
  
  return data as CashMovementWithDirection[];
}