import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
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
  service_id: integer('service_id').notNull().references(() => apiServices.service_id),
  api_key: text('api_key').notNull(),
  api_secret: text('api_secret'),
  key_name: text('key_name'),
  environment: text('environment').default('PRODUCTION'),
  is_active: integer('is_active').default(1),
  is_primary: integer('is_primary').default(0),
  daily_request_limit: integer('daily_request_limit'),
  notes: text('notes'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
});

// EXCHANGES
export const exchanges = sqliteTable('exchanges', {
  exchange_id: integer('exchange_id').primaryKey({ autoIncrement: true }),
  exchange_code: text('exchange_code').notNull().unique(),
  exchange_name: text('exchange_name').notNull(),
  country_code: text('country_code').references(() => countries.country_code),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  exchange_type: text('exchange_type').default('STOCK'),
});

// ASSETS
export const assetClasses = sqliteTable('asset_classes', {
  class_id: integer('class_id').primaryKey({ autoIncrement: true }),
  class_code: text('class_code').notNull().unique(),
  class_name: text('class_name').notNull(),
  description: text('description'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const assetTypes = sqliteTable('asset_types', {
  type_id: integer('type_id').primaryKey({ autoIncrement: true }),
  type_code: text('type_code').notNull().unique(),
  type_name: text('type_name').notNull(),
  class_id: integer('class_id').references(() => assetClasses.class_id),
  description: text('description'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const assetClassifications = sqliteTable('asset_classifications', {
  classification_id: text('classification_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  exchange_id: integer('exchange_id').notNull().references(() => exchanges.exchange_id),
  class_id: integer('class_id').notNull().references(() => assetClasses.class_id),
  type_id: integer('type_id').references(() => assetTypes.type_id),
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
  cash_movement_id: text('cash_movement_id').primaryKey(),
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
  dividend_id: text('dividend_id').primaryKey(),
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
  news_id: text('news_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  exchange_id: integer('exchange_id').references(() => exchanges.exchange_id),
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

export const planningActions = sqliteTable('planning_actions', {
  action_id: text('action_id').primaryKey(),
  scenario_id: text('scenario_id').notNull().references(() => planningScenarios.scenario_id),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  exchange_id: integer('exchange_id').notNull().references(() => exchanges.exchange_id),
  action_type: text('action_type'),
  capital_allocated: real('capital_allocated'),
  buy_price: real('buy_price'),
  buy_quantity: real('buy_quantity'),
  sell_quantity: real('sell_quantity'),
  sell_price: real('sell_price'),
  stop_loss: real('stop_loss'),
  take_profit: real('take_profit'),
  withdraw_funds: integer('withdraw_funds').default(0),
  notes: text('notes'),
  rationale: text('rationale'),
  action_order: integer('action_order').default(1),
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
  position_id: text('position_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  exchange_id: integer('exchange_id').notNull().references(() => exchanges.exchange_id),
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
});

// TRANSACTIONS
export const transactionTypes = sqliteTable('transaction_types', {
  type_id: integer('type_id').primaryKey({ autoIncrement: true }),
  type_name: text('type_name').notNull().unique(),
  type_multiplier: integer('type_multiplier').notNull(),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const transactions = sqliteTable('transactions', {
  transaction_id: text('transaction_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  exchange_id: integer('exchange_id').notNull().references(() => exchanges.exchange_id),
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

export const tradeLots = sqliteTable('trade_lots', {
  lot_id: text('lot_id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.user_id),
  ticker: text('ticker').notNull(),
  exchange_id: integer('exchange_id').notNull().references(() => exchanges.exchange_id),
  entry_date: text('entry_date').notNull(),
  entry_price: real('entry_price').notNull(),
  quantity: real('quantity').notNull(),
  entry_fees: real('entry_fees').default(0),
  entry_transaction_id: text('entry_transaction_id').references(() => transactions.transaction_id),
  exit_date: text('exit_date'),
  exit_price: real('exit_price'),
  exit_fees: real('exit_fees').default(0),
  exit_transaction_id: text('exit_transaction_id').references(() => transactions.transaction_id),
  lot_status: text('lot_status').default('OPEN'),
  notes: text('notes'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
  updated_at: text('updated_at').default(sql`(datetime('now'))`),
  trade_currency: text('trade_currency').default('USD'),
  realized_pl: real('realized_pl'),
  trade_hold_days: integer('trade_hold_days'),
  trade_strategy: integer('trade_strategy').references(() => tradeStrategies.strategy_id),
  realized_pl_percent: real('realized_pl_percent'),
});

// WATCHLIST
export const watchlist = sqliteTable('watchlist', {
  watchlist_id: text('watchlist_id').primaryKey(),
  user_id: text('user_id').references(() => users.user_id),
  ticker: text('ticker'),
  exchange_id: integer('exchange_id').references(() => exchanges.exchange_id),
  target_buy_price: real('target_buy_price'),
  notes: text('notes'),
  added_date: text('added_date'),
});

// AUDIT LOG
export const auditLog = sqliteTable('audit_log', {
  log_id: text('log_id').primaryKey(),
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
  expires_at: text('expires_at').notNull(),
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