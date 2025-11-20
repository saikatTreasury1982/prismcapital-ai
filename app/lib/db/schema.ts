import { sqliteTable, text, integer, real, sqliteView } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// USERS AND RELATED TABLES
export const countries = sqliteTable('countries', {
  country_code: text('country_code').primaryKey(),
  country_name: text('country_name').notNull(),
  currency_code: text('currency_code').notNull(),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const users = sqliteTable('users', {
  user_id: text('user_id').primaryKey(),
  first_name: text('first_name').notNull(),
  middle_name: text('middle_name'),
  last_name: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  resident_country: text('resident_country').notNull().references(() => countries.country_code),
  home_currency: text('home_currency').notNull(),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
  is_active: integer('is_active').default(1),
  auth_user_id: text('auth_user_id'),
});

export const userPreferences = sqliteTable('user_preferences', {
  user_id: text('user_id').primaryKey().references(() => users.user_id),
  default_currency: text('default_currency'),
  decimal_places: integer('decimal_places').default(2),
  date_format: text('date_format').default('YYYY-MM-DD'),
  theme: text('theme').default('light'),
  dashboard_layout: text('dashboard_layout'),
  notifications_enabled: integer('notifications_enabled').default(1),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
  default_trading_currency: text('default_trading_currency').default('USD'),
  pnl_strategy_id: integer('pnl_strategy_id'),
});

// API SERVICES
export const apiServices = sqliteTable('api_services', {
  service_id: integer('service_id').primaryKey({ autoIncrement: true }),
  service_code: text('service_code').notNull().unique(),
  service_name: text('service_name').notNull(),
  service_url: text('service_url'),
  description: text('description'),
  documentation_url: text('documentation_url'),
  is_active: integer('is_active').default(1),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const systemApiKeys = sqliteTable('system_api_keys', {
  api_key_id: text('api_key_id').primaryKey(),
  service_id: integer('service_id').notNull(),
  api_key: text('api_key').notNull(),
  api_secret: text('api_secret'),
  key_name: text('key_name'),
  environment: text('environment').default('PRODUCTION'),
  is_active: integer('is_active').default(1),
  is_primary: integer('is_primary').default(0),
  daily_request_limit: integer('daily_request_limit'),
  notes: text('notes'),
  created_at: text('created_at').default(sql`datetime('now')`),
  updated_at: text('updated_at').default(sql`datetime('now')`),
});

// EXCHANGES
export const exchanges = sqliteTable('exchanges', {
  exchange_code: text('exchange_code').primaryKey(),
  exchange_name: text('exchange_name').notNull(),
  country_code: text('country_code').references(() => countries.country_code),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  exchange_type: text('exchange_type').default('STOCK'),
});

// ASSETS
export const assetClasses = sqliteTable('asset_classes', {
  class_code: text('class_code').primaryKey(),
  class_name: text('class_name').notNull(),
  description: text('description'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const assetTypes = sqliteTable('asset_types', {
  type_code: text('type_code').primaryKey(),
  type_name: text('type_name').notNull(),
  class_id: integer('class_id').references(() => assetClasses.class_code),
  description: text('description'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const assetClassifications = sqliteTable('asset_classifications', {
  classification_id: text('classification_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  exchange_id: text('exchange_id').notNull().references(() => exchanges.exchange_code),
  class_id: text('class_id').notNull().references(() => assetClasses.class_code),
  type_id: text('type_id').references(() => assetTypes.type_code),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
});

// CASH MOVEMENTS
export const cashMovementDirections = sqliteTable('cash_movement_directions', {
  direction_id: integer('direction_id').primaryKey({ autoIncrement: true }),
  direction_code: text('direction_code').notNull().unique(),
  direction_name: text('direction_name').notNull(),
  multiplier: integer('multiplier').notNull(),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const cashMovements = sqliteTable('cash_movements', {
  cash_movement_id: integer('cash_movement_id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => users.user_id),
  home_currency_code: text('home_currency_code').notNull(),
  home_currency_value: real('home_currency_value').notNull(),
  trading_currency_code: text('trading_currency_code').notNull(),
  trading_currency_value: real('trading_currency_value').notNull(),
  spot_rate: real('spot_rate').notNull(),
  direction_id: integer('direction_id').notNull().references(() => cashMovementDirections.direction_id),
  transaction_date: text('transaction_date').notNull(),
  period_from: text('period_from'),
  period_to: text('period_to'),
  notes: text('notes'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
});

// DIVIDENDS
export const dividends = sqliteTable('dividends', {
  dividend_id: integer('dividend_id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  ex_dividend_date: text('ex_dividend_date').notNull(),
  payment_date: text('payment_date'),
  dividend_per_share: real('dividend_per_share').notNull(),
  shares_owned: real('shares_owned').notNull(),
  notes: text('notes'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
  dividend_yield: real('dividend_yield'),
  total_dividend_amount: real('total_dividend_amount'),
  Currency: text('Currency'),
});

// NEWS
export const newsTypes = sqliteTable('news_types', {
  news_type_id: integer('news_type_id').primaryKey({ autoIncrement: true }),
  type_code: text('type_code').notNull().unique(),
  type_name: text('type_name').notNull(),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const news = sqliteTable('news', {
  news_id: integer('news_id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  exchange_id: integer('exchange_id').references(() => exchanges.exchange_code),
  company_name: text('company_name'),
  news_type_id: integer('news_type_id').notNull().references(() => newsTypes.news_type_id),
  news_description: text('news_description').notNull(),
  news_date: text('news_date').notNull(),
  alert_date: text('alert_date'),
  alert_notes: text('alert_notes'),
  news_source: text('news_source'),
  news_url: text('news_url'),
  tags: text('tags'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
});

// PLANNING
export const planningScenarios = sqliteTable('planning_scenarios', {
  scenario_id: text('scenario_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  scenario_name: text('scenario_name').notNull(),
  scenario_description: text('scenario_description'),
  created_date: text('created_date'),
  is_active: integer('is_active').default(1),
  cloned_from_scenario_id: text('cloned_from_scenario_id'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
});

// POSITIONS
export const tradeStrategies = sqliteTable('trade_strategies', {
  strategy_id: integer('strategy_id').primaryKey({ autoIncrement: true }),
  strategy_code: text('strategy_code').notNull().unique(),
  strategy_name: text('strategy_name').notNull(),
  description: text('description'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const positions = sqliteTable('positions', {
  position_id: integer('position_id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  total_shares: real('total_shares').default(0),
  average_cost: real('average_cost').notNull(),
  current_market_price: real('current_market_price'),
  is_active: integer('is_active').default(1),
  opened_date: text('opened_date'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
  strategy_id: integer('strategy_id').references(() => tradeStrategies.strategy_id),
  position_currency: text('position_currency').default('USD'),
  ticker_name: text('ticker_name'),
  current_value: real('current_value'),
  unrealized_pnl: real('unrealized_pnl'),
  realized_pnl: real('realized_pnl').default(0),
});

export const realizedPnlHistory = sqliteTable('realized_pnl_history', {
  realization_id: integer('realization_id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => users.user_id),
  position_id: integer('position_id'),
  ticker: text('ticker').notNull(),
  sale_date: text('sale_date').notNull(),
  quantity: real('quantity').notNull(),
  average_cost: real('average_cost').notNull(),
  total_cost: real('total_cost').notNull(),
  sale_price: real('sale_price').notNull(),
  total_proceeds: real('total_proceeds').notNull(),
  realized_pnl: real('realized_pnl').notNull(),
  entry_date: text('entry_date'),
  position_currency: text('position_currency').default('USD'),
  fees: real('fees').default(0),
  notes: text('notes'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const tradeAnalyses = sqliteTable('trade_analyses', {
  analysis_id: integer('analysis_id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  exchange_code: text('exchange_code').references(() => exchanges.exchange_code),
  entry_price: real('entry_price').notNull(),
  position_size: real('position_size').notNull(),
  stop_loss: real('stop_loss'),
  take_profit: real('take_profit'),
  shares_to_buy: real('shares_to_buy'),
  risk_percentage: real('risk_percentage'),
  reward_percentage: real('reward_percentage'),
  risk_reward_ratio: real('risk_reward_ratio'),
  is_flagged: integer('is_flagged').default(0),
  status: text('status').default('ANALYZING'),
  notes: text('notes'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
});

export const positionActionPlans = sqliteTable('position_action_plans', {
  plan_id: integer('plan_id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => users.user_id),
  position_id: integer('position_id').notNull().references(() => positions.position_id),
  action_type: text('action_type').notNull(),
  sell_percentage: real('sell_percentage'),
  sell_shares: real('sell_shares'),
  expected_proceeds: real('expected_proceeds'),
  reinvest_ticker: text('reinvest_ticker'),
  reinvest_amount: real('reinvest_amount'),
  withdraw_amount: real('withdraw_amount'),
  withdraw_currency: text('withdraw_currency'),
  notes: text('notes'),
  status: text('status').default('DRAFT'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
});

// TRANSACTIONS
export const transactionTypes = sqliteTable('transaction_types', {
  type_id: integer('type_id').primaryKey({ autoIncrement: true }),
  type_name: text('type_name').notNull().unique(),
  type_multiplier: integer('type_multiplier').notNull(),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const transactions = sqliteTable('transactions', {
  transaction_id: integer('transaction_id').primaryKey({ autoIncrement: true }),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  transaction_type_id: integer('transaction_type_id').notNull().references(() => transactionTypes.type_id),
  transaction_date: text('transaction_date').notNull(),
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
  fees: real('fees').default(0),
  notes: text('notes'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
  trade_lot_id: text('trade_lot_id'),
  transaction_currency: text('transaction_currency').default('USD'),
  trade_value: real('trade_value'),
});

// AUDIT LOG
export const auditLog = sqliteTable('audit_log', {
  session_id: text('log_id').primaryKey(),
  user_id: text('user_id').references(() => users.user_id),
  action_type: text('action_type'),
  table_name: text('table_name'),
  record_id: text('record_id'),
  old_values: text('old_values'),
  new_values: text('new_values'),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

// AUTH TABLES
export const authSessions = sqliteTable('auth_sessions', {
  session_id: text('session_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  session_status: text('session_status').default('OPEN'),
  closed_at: text('closed_at'),
  credential_id: text('credential_id').references(() => authPasskeys.credential_id),
  otp_id: text('otp_id').references(() => authOtpCodes.otp_id),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const authPasskeys = sqliteTable('auth_passkeys', {
  credential_id: text('credential_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  public_key: text('public_key').notNull(),
  counter: integer('counter').default(0),
  device_name: text('device_name'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  last_used_at: text('last_used_at'),
});

export const authOtpCodes = sqliteTable('auth_otp_codes', {
  otp_id: text('otp_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  phone_number: text('phone_number').notNull(),
  code: text('code').notNull(),
  expires_at: text('expires_at').notNull(),
  is_used: integer('is_used').default(0),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const pnlStrategies = sqliteTable('pnl_strategies', {
  strategy_id: integer('strategy_id').primaryKey({ autoIncrement: true }),
  strategy_code: text('strategy_code').notNull().unique(),
  strategy_name: text('strategy_name').notNull(),
  strategy_description: text('strategy_description'),
  requires_lot_tracking: integer('requires_lot_tracking').default(0),
  is_active: integer('is_active').default(1),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

import { sql as sqlTemplate } from 'drizzle-orm';

// Cash Balance summary views
export const cashBalanceSummary = sqliteView('cash_balance_summary', {}).as(sqlTemplate`SELECT * FROM cash_balance_summary`);

// Dividend summary views
export const dividendSummaryByTicker = sqliteView('dividend_summary_by_ticker', {}).as(sqlTemplate`SELECT * FROM dividend_summary_by_ticker`);
export const dividendSummaryByQuarter = sqliteView('dividend_summary_by_quarter', {}).as(sqlTemplate`SELECT * FROM dividend_summary_by_quarter`);
export const dividendSummaryByYear = sqliteView('dividend_summary_by_year', {}).as(sqlTemplate`SELECT * FROM dividend_summary_by_year`);

// News summary views
export const newsSummaryByTicker = sqliteView('news_summary_by_ticker', {}).as(sqlTemplate`SELECT * FROM news_summary_by_ticker`);
export const newsSummaryByType = sqliteView('news_summary_by_type', {}).as(sqlTemplate`SELECT * FROM news_summary_by_type`);
export const earningsNews = sqliteView('earnings_news', {}).as(sqlTemplate`SELECT * FROM earnings_news`);
export const generalNews = sqliteView('general_news', {}).as(sqlTemplate`SELECT * FROM general_news`);

export const schema = {
  users,
  exchanges,
  transactionTypes,
  transactions,
  positions,
  dividends,
  cashMovements,
  realizedPnlHistory,
  tradeStrategies,
  assetClassifications,
  assetClasses,
  tradeAnalyses,
  positionActionPlans, // Make sure this is here!
};