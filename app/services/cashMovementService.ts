
import { db, schema } from '../lib/db';
import { eq, and, isNull, isNotNull, desc, asc } from 'drizzle-orm';
import { 
  CashMovement, 
  CashMovementWithDirection, 
  CashBalanceSummary, 
  UserCurrencies, 
  CreateCashMovementInput,
  PeriodStats 
} from '../lib/types/funding';

const { users, userPreferences, cashMovements, cashMovementDirections, cashBalanceSummary } = schema;

export async function getUserCurrencies(userId: string): Promise<UserCurrencies> {
  // Get home currency from users table
  const userData = await db
    .select()
    .from(users)
    .where(eq(users.user_id, userId))
    .limit(1);

  if (!userData || userData.length === 0) throw new Error('User not found');

  // Get trading currency from user_preferences table
  const prefData = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.user_id, userId))
    .limit(1);

  if (!prefData || prefData.length === 0) throw new Error('User preferences not found');

  return {
    home_currency: userData[0].home_currency,
    trading_currency: prefData[0].default_trading_currency || 'USD'
  };
}

export async function getCashMovements(userId: string): Promise<CashMovementWithDirection[]> {
  const movements = await db
    .select({
      movement: cashMovements,
      direction: cashMovementDirections,
    })
    .from(cashMovements)
    .leftJoin(
      cashMovementDirections,
      eq(cashMovements.direction_id, cashMovementDirections.direction_id)
    )
    .where(eq(cashMovements.user_id, userId))
    .orderBy(desc(cashMovements.transaction_date));

  return movements.map(m => ({
    ...m.movement,
    direction: m.direction
  })) as CashMovementWithDirection[];
}

export async function getCashBalanceSummary(userId: string): Promise<CashBalanceSummary> {
  const data = await db.select().from(cashBalanceSummary).all();
  const filtered = data.filter((row: any) => row.user_id === userId);

  if (!filtered || filtered.length === 0) {
    const currencies = await getUserCurrencies(userId);
    return {
      user_id: userId,
      home_currency_code: currencies.home_currency,
      trading_currency_code: currencies.trading_currency,
      total_deposited_home: 0,
      total_withdrawn_home: 0,
      net_home_currency: 0,
      total_deposited_trading: 0,
      total_withdrawn_trading: 0,
      net_trading_currency: 0,
      weighted_avg_rate: 0,
      deposit_count: 0,
      withdrawal_count: 0,
      first_transaction_date: new Date().toISOString(),
      last_transaction_date: new Date().toISOString(),
    };
  }
  
  return data[0] as any;
}

export async function createCashMovement(
  userId: string, 
  input: CreateCashMovementInput,
  homeCurrencyCode: string,
  tradingCurrencyCode: string
): Promise<CashMovement> {
  // Get user currencies
  const currencies = await getUserCurrencies(userId);
  
  // Calculate trading currency value
  const trading_currency_value = input.home_currency_value * input.spot_rate;

  const data = await db
    .insert(cashMovements)
    .values({
      user_id: userId,
      home_currency_code: homeCurrencyCode,
      home_currency_value: input.home_currency_value,
      trading_currency_code: tradingCurrencyCode,
      trading_currency_value: trading_currency_value,
      spot_rate: input.spot_rate,
      spot_rate_isActual: input.spot_rate_isActual ?? 1, // Default to 1 (Actual) if not provided
      direction_id: input.direction_id,
      transaction_date: input.transaction_date,
      period_from: input.period_from,
      period_to: input.period_to,
      notes: input.notes || null
    })
    .returning();

  return data[0] as CashMovement;
}

export async function getPeriodStats(userId: string): Promise<PeriodStats[]> {
 
  const movementsData = await db
    .select({
      movement: cashMovements,
      direction: cashMovementDirections,
    })
    .from(cashMovements)
    .leftJoin(
      cashMovementDirections,
      eq(cashMovements.direction_id, cashMovementDirections.direction_id)
    )
    .where(eq(cashMovements.user_id, userId))
    .orderBy(asc(cashMovements.period_from));

  const movements = movementsData.map(m => ({
    ...m.movement,
    direction: m.direction
  }));

  // Group by period_from AND period_to combination
  const periodMap = new Map<string, PeriodStats>();
  let cumulativeHome = 0;
  let cumulativeTrading = 0;

  movements.forEach((movement: any) => {
    const periodFrom = movement.period_from || 'No Period';
    const periodTo = movement.period_to || null;
    const periodKey = `${periodFrom}|${periodTo}`; // Use pipe as separator
    
    if (!periodMap.has(periodKey)) {
      // Format period display
      let periodDisplay = 'No Period';
      if (periodFrom !== 'No Period') {
        const fromDate = new Date(periodFrom).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        if (periodTo) {
          const toDate = new Date(periodTo).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
          periodDisplay = `${fromDate} - ${toDate}`;
        } else {
          periodDisplay = `${fromDate} - Ongoing`;
        }
      }

      periodMap.set(periodKey, {
        period_from: periodFrom,
        period_to: periodTo,
        period_display: periodDisplay,
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

export async function getUniquePeriods(userId: string): Promise<Array<{period_from: string, period_to: string | null, period_display: string}>> {
  
  const movements = await db
    .select({
      period_from: cashMovements.period_from,
      period_to: cashMovements.period_to,
    })
    .from(cashMovements)
    .where(
      and(
        eq(cashMovements.user_id, userId),
        isNotNull(cashMovements.period_from)
      )
    )
    .orderBy(asc(cashMovements.period_from));

  // Get unique period combinations
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
  const conditions = periodTo
    ? and(
        eq(cashMovements.user_id, userId),
        eq(cashMovements.period_from, periodFrom),
        eq(cashMovements.period_to, periodTo)
      )
    : and(
        eq(cashMovements.user_id, userId),
        eq(cashMovements.period_from, periodFrom),
        isNull(cashMovements.period_to)
      );

  const movementsData = await db
    .select({
      movement: cashMovements,
      direction: cashMovementDirections,
    })
    .from(cashMovements)
    .leftJoin(
      cashMovementDirections,
      eq(cashMovements.direction_id, cashMovementDirections.direction_id)
    )
    .where(conditions)
    .orderBy(desc(cashMovements.transaction_date));

  return movementsData.map(m => ({
    ...m.movement,
    direction: m.direction
  })) as CashMovementWithDirection[];
}