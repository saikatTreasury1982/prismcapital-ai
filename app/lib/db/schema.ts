import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// USERS AND RELATED TABLES
export const countries = sqliteTable('countries', {
  countryCode: text('country_code').primaryKey(),
  countryName: text('country_name').notNull(),
  currencyCode: text('currency_code').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const users = sqliteTable('users', {
  userId: text('user_id').primaryKey(),
  firstName: text('first_name').notNull(),
  middleName: text('middle_name'),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  residentCountry: text('resident_country').notNull().references(() => countries.countryCode),
  homeCurrency: text('home_currency').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  isActive: integer('is_active').default(1),
  authUserId: text('auth_user_id'),
});

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id').primaryKey().references(() => users.userId),
  defaultCurrency: text('default_currency'),
  decimalPlaces: integer('decimal_places').default(2),
  dateFormat: text('date_format').default('YYYY-MM-DD'),
  theme: text('theme').default('light'),
  dashboardLayout: text('dashboard_layout'),
  notificationsEnabled: integer('notifications_enabled').default(1),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  defaultTradingCurrency: text('default_trading_currency').default('USD'),
});

// API SERVICES
export const apiServices = sqliteTable('api_services', {
  serviceId: integer('service_id').primaryKey({ autoIncrement: true }),
  serviceCode: text('service_code').notNull().unique(),
  serviceName: text('service_name').notNull(),
  serviceUrl: text('service_url'),
  description: text('description'),
  documentationUrl: text('documentation_url'),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const systemApiKeys = sqliteTable('system_api_keys', {
  apiKeyId: text('api_key_id').primaryKey(),
  serviceId: integer('service_id').notNull().references(() => apiServices.serviceId),
  apiKey: text('api_key').notNull(),
  apiSecret: text('api_secret'),
  keyName: text('key_name'),
  environment: text('environment').default('PRODUCTION'),
  isActive: integer('is_active').default(1),
  isPrimary: integer('is_primary').default(0),
  dailyRequestLimit: integer('daily_request_limit'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// EXCHANGES
export const exchanges = sqliteTable('exchanges', {
  exchangeId: integer('exchange_id').primaryKey({ autoIncrement: true }),
  exchangeCode: text('exchange_code').notNull().unique(),
  exchangeName: text('exchange_name').notNull(),
  countryCode: text('country_code').references(() => countries.countryCode),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  exchangeType: text('exchange_type').default('STOCK'),
});

// ASSETS
export const assetClasses = sqliteTable('asset_classes', {
  classId: integer('class_id').primaryKey({ autoIncrement: true }),
  classCode: text('class_code').notNull().unique(),
  className: text('class_name').notNull(),
  description: text('description'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const assetTypes = sqliteTable('asset_types', {
  typeId: integer('type_id').primaryKey({ autoIncrement: true }),
  typeCode: text('type_code').notNull().unique(),
  typeName: text('type_name').notNull(),
  classId: integer('class_id').references(() => assetClasses.classId),
  description: text('description'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const assetClassifications = sqliteTable('asset_classifications', {
  classificationId: text('classification_id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.userId),
  ticker: text('ticker').notNull(),
  exchangeId: integer('exchange_id').notNull().references(() => exchanges.exchangeId),
  classId: integer('class_id').notNull().references(() => assetClasses.classId),
  typeId: integer('type_id').references(() => assetTypes.typeId),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// CASH MOVEMENTS
export const cashMovementDirections = sqliteTable('cash_movement_directions', {
  directionId: integer('direction_id').primaryKey({ autoIncrement: true }),
  directionCode: text('direction_code').notNull().unique(),
  directionName: text('direction_name').notNull(),
  multiplier: integer('multiplier').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const cashMovements = sqliteTable('cash_movements', {
  cashMovementId: text('cash_movement_id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.userId),
  homeCurrencyCode: text('home_currency_code').notNull(),
  homeCurrencyValue: real('home_currency_value').notNull(),
  tradingCurrencyCode: text('trading_currency_code').notNull(),
  tradingCurrencyValue: real('trading_currency_value').notNull(),
  spotRate: real('spot_rate').notNull(),
  directionId: integer('direction_id').notNull().references(() => cashMovementDirections.directionId),
  transactionDate: text('transaction_date').notNull(),
  periodFrom: text('period_from'),
  periodTo: text('period_to'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// DIVIDENDS
export const dividends = sqliteTable('dividends', {
  dividendId: text('dividend_id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.userId),
  ticker: text('ticker').notNull(),
  exDividendDate: text('ex_dividend_date').notNull(),
  paymentDate: text('payment_date'),
  dividendPerShare: real('dividend_per_share').notNull(),
  sharesOwned: real('shares_owned').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  dividendYield: real('dividend_yield'),
  totalDividendAmount: real('total_dividend_amount'),
  currency: text('Currency'),
});

// NEWS
export const newsTypes = sqliteTable('news_types', {
  newsTypeId: integer('news_type_id').primaryKey({ autoIncrement: true }),
  typeCode: text('type_code').notNull().unique(),
  typeName: text('type_name').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const news = sqliteTable('news', {
  newsId: text('news_id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.userId),
  ticker: text('ticker').notNull(),
  exchangeId: integer('exchange_id').references(() => exchanges.exchangeId),
  companyName: text('company_name'),
  newsTypeId: integer('news_type_id').notNull().references(() => newsTypes.newsTypeId),
  newsDescription: text('news_description').notNull(),
  newsDate: text('news_date').notNull(),
  alertDate: text('alert_date'),
  alertNotes: text('alert_notes'),
  newsSource: text('news_source'),
  newsUrl: text('news_url'),
  tags: text('tags'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// PLANNING
export const planningScenarios = sqliteTable('planning_scenarios', {
  scenarioId: text('scenario_id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.userId),
  scenarioName: text('scenario_name').notNull(),
  scenarioDescription: text('scenario_description'),
  createdDate: text('created_date'),
  isActive: integer('is_active').default(1),
  clonedFromScenarioId: text('cloned_from_scenario_id'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const planningActions = sqliteTable('planning_actions', {
  actionId: text('action_id').primaryKey(),
  scenarioId: text('scenario_id').notNull().references(() => planningScenarios.scenarioId),
  userId: text('user_id').notNull().references(() => users.userId),
  ticker: text('ticker').notNull(),
  exchangeId: integer('exchange_id').notNull().references(() => exchanges.exchangeId),
  actionType: text('action_type'),
  capitalAllocated: real('capital_allocated'),
  buyPrice: real('buy_price'),
  buyQuantity: real('buy_quantity'),
  sellQuantity: real('sell_quantity'),
  sellPrice: real('sell_price'),
  stopLoss: real('stop_loss'),
  takeProfit: real('take_profit'),
  withdrawFunds: integer('withdraw_funds').default(0),
  notes: text('notes'),
  rationale: text('rationale'),
  actionOrder: integer('action_order').default(1),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// POSITIONS
export const tradeStrategies = sqliteTable('trade_strategies', {
  strategyId: integer('strategy_id').primaryKey({ autoIncrement: true }),
  strategyCode: text('strategy_code').notNull().unique(),
  strategyName: text('strategy_name').notNull(),
  description: text('description'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const positions = sqliteTable('positions', {
  positionId: text('position_id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.userId),
  ticker: text('ticker').notNull(),
  exchangeId: integer('exchange_id').notNull().references(() => exchanges.exchangeId),
  totalShares: real('total_shares').default(0),
  averageCost: real('average_cost').notNull(),
  currentMarketPrice: real('current_market_price'),
  isActive: integer('is_active').default(1),
  openedDate: text('opened_date'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  strategyId: integer('strategy_id').references(() => tradeStrategies.strategyId),
  positionCurrency: text('position_currency').default('USD'),
  tickerName: text('ticker_name'),
  currentValue: real('current_value'),
  unrealizedPnl: real('unrealized_pnl'),
});

// TRANSACTIONS
export const transactionTypes = sqliteTable('transaction_types', {
  typeId: integer('type_id').primaryKey({ autoIncrement: true }),
  typeName: text('type_name').notNull().unique(),
  typeMultiplier: integer('type_multiplier').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const transactions = sqliteTable('transactions', {
  transactionId: text('transaction_id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.userId),
  ticker: text('ticker').notNull(),
  exchangeId: integer('exchange_id').notNull().references(() => exchanges.exchangeId),
  transactionTypeId: integer('transaction_type_id').notNull().references(() => transactionTypes.typeId),
  transactionDate: text('transaction_date').notNull(),
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
  fees: real('fees').default(0),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  tradeLotId: text('trade_lot_id'),
  transactionCurrency: text('transaction_currency').default('USD'),
  tradeValue: real('trade_value'),
});

export const tradeLots = sqliteTable('trade_lots', {
  lotId: text('lot_id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.userId),
  ticker: text('ticker').notNull(),
  exchangeId: integer('exchange_id').notNull().references(() => exchanges.exchangeId),
  entryDate: text('entry_date').notNull(),
  entryPrice: real('entry_price').notNull(),
  quantity: real('quantity').notNull(),
  entryFees: real('entry_fees').default(0),
  entryTransactionId: text('entry_transaction_id').references(() => transactions.transactionId),
  exitDate: text('exit_date'),
  exitPrice: real('exit_price'),
  exitFees: real('exit_fees').default(0),
  exitTransactionId: text('exit_transaction_id').references(() => transactions.transactionId),
  lotStatus: text('lot_status').default('OPEN'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  tradeCurrency: text('trade_currency').default('USD'),
  realizedPl: real('realized_pl'),
  tradeHoldDays: integer('trade_hold_days'),
  tradeStrategy: integer('trade_strategy').references(() => tradeStrategies.strategyId),
  realizedPlPercent: real('realized_pl_percent'),
});

// WATCHLIST
export const watchlist = sqliteTable('watchlist', {
  watchlistId: text('watchlist_id').primaryKey(),
  userId: text('user_id').references(() => users.userId),
  ticker: text('ticker'),
  exchangeId: integer('exchange_id').references(() => exchanges.exchangeId),
  targetBuyPrice: real('target_buy_price'),
  notes: text('notes'),
  addedDate: text('added_date'),
});

// AUDIT LOG
export const auditLog = sqliteTable('audit_log', {
  logId: text('log_id').primaryKey(),
  userId: text('user_id').references(() => users.userId),
  actionType: text('action_type'),
  tableName: text('table_name'),
  recordId: text('record_id'),
  oldValues: text('old_values'),
  newValues: text('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});