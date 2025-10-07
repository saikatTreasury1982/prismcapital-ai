import { createClient } from '@/utils/supabase/server';
import { 
  CashMovement, 
  CashMovementWithDirection, 
  CashBalanceSummary, 
  UserCurrencies, 
  CreateCashMovementInput,
  PeriodStats 
} from '../lib/types/funding';

export async function getUserCurrencies(userId: string): Promise<UserCurrencies> {
  const supabase = await createClient();
  
  // Get home currency from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('home_currency')
    .eq('user_id', userId)
    .single();

  if (userError) throw userError;

  // Get trading currency from user_preferences table
  const { data: prefData, error: prefError } = await supabase
    .from('user_preferences')
    .select('default_trading_currency')
    .eq('user_id', userId)
    .single();

  if (prefError) throw prefError;

  return {
    home_currency: userData.home_currency,
    trading_currency: prefData.default_trading_currency || 'USD'
  };
}

export async function getCashMovements(userId: string): Promise<CashMovementWithDirection[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cash_movements')
    .select(`
      *,
      direction:cash_movement_directions(*)
    `)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  
  return data as CashMovementWithDirection[];
}

export async function getCashBalanceSummary(userId: string): Promise<CashBalanceSummary> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cash_balance_summary')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  
  return data;
}

export async function createCashMovement(
  userId: string, 
  input: CreateCashMovementInput
): Promise<CashMovement> {
  const supabase = await createClient();
  
  // Get user currencies
  const currencies = await getUserCurrencies(userId);
  
  // Calculate trading currency value
  const trading_currency_value = input.home_currency_value * input.spot_rate;
  
  const { data, error } = await supabase
    .from('cash_movements')
    .insert({
      user_id: userId,
      home_currency_code: currencies.home_currency,
      home_currency_value: input.home_currency_value,
      trading_currency_code: currencies.trading_currency,
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

export async function getPeriodStats(userId: string): Promise<PeriodStats[]> {
  const supabase = await createClient();
  
  const { data: movements, error } = await supabase
    .from('cash_movements')
    .select(`
      *,
      direction:cash_movement_directions(*)
    `)
    .eq('user_id', userId)
    .order('period_from', { ascending: true });

  if (error) throw error;

  // Group by period and calculate stats
  const periodMap = new Map<string, PeriodStats>();
  let cumulativeHome = 0;
  let cumulativeTrading = 0;

  movements.forEach((movement: any) => {
    const periodKey = movement.period_from || 'No Period';
    
    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: periodKey,
        inflow_home: 0,
        outflow_home: 0,
        net_flow_home: 0,
        inflow_trading: 0,
        outflow_trading: 0,
        net_flow_trading: 0,
        transaction_count: 0,
        cumulative_home: 0,
        cumulative_trading: 0
      });
    }

    const stats = periodMap.get(periodKey)!;
    const multiplier = movement.direction.multiplier;

    if (multiplier > 0) {
      stats.inflow_home += movement.home_currency_value;
      stats.inflow_trading += movement.trading_currency_value;
    } else {
      stats.outflow_home += movement.home_currency_value;
      stats.outflow_trading += movement.trading_currency_value;
    }

    stats.net_flow_home += movement.home_currency_value * multiplier;
    stats.net_flow_trading += movement.trading_currency_value * multiplier;
    stats.transaction_count++;
  });

  // Calculate cumulative values
  const periodsArray = Array.from(periodMap.values());
  periodsArray.forEach(stats => {
    cumulativeHome += stats.net_flow_home;
    cumulativeTrading += stats.net_flow_trading;
    stats.cumulative_home = cumulativeHome;
    stats.cumulative_trading = cumulativeTrading;
  });

  return periodsArray;
}