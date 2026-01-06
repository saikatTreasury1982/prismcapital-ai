declare module 'moomoo-api' {
  class mmWebsocket {
    constructor();
    
    // Connection methods
    start(host: string, port: number, enableSSL: boolean, key: string): void;
    stop(): void;
    getConnID(): number;
    
    // Callback handlers
    onlogin: ((ret: number, msg: string) => void) | null;
    onPush: ((cmd: number, data: any) => void) | null;
    
    // Trading account methods
    GetAccList(req: any): Promise<any>;
    UnlockTrade(req: any): Promise<any>;
    SubAccPush(req: any): Promise<any>;
    
    // Position and funds methods
    GetFunds(req: any): Promise<any>;
    GetPositionList(req: any): Promise<any>;
    GetMaxTrdQtys(req: any): Promise<any>;
    
    // Order methods
    GetOrderList(req: any): Promise<any>;
    PlaceOrder(req: any): Promise<any>;
    ModifyOrder(req: any): Promise<any>;
    GetOrderFillList(req: any): Promise<any>;
    
    // Historical data methods
    GetHistoryOrderList(req: any): Promise<any>;
    GetHistoryOrderFillList(req: any): Promise<any>;
    GetOrderFee(req: any): Promise<any>;
    
    // Margin and flow methods
    GetMarginRatio(req: any): Promise<any>;
    GetFlowSummary(req: any): Promise<any>;
    
    // Quote methods
    GetGlobalState(req: any): Promise<any>;
    RegQotPush(req: any): Promise<any>;
    GetSubInfo(req: any): Promise<any>;
    GetTicker(req: any): Promise<any>;
    GetBasicQot(req: any): Promise<any>;
    GetOrderBook(req: any): Promise<any>;
    GetKL(req: any): Promise<any>;
    GetRT(req: any): Promise<any>;
    GetBroker(req: any): Promise<any>;
    
    // Additional quote methods
    RequestRehab(req: any): Promise<any>;
    RequestHistoryKL(req: any): Promise<any>;
    RequestHistoryKLQuota(req: any): Promise<any>;
    GetTradeDate(req: any): Promise<any>;
    GetStaticInfo(req: any): Promise<any>;
    GetSecuritySnapshot(req: any): Promise<any>;
    GetPlateSet(req: any): Promise<any>;
    GetPlateSecurity(req: any): Promise<any>;
    GetReference(req: any): Promise<any>;
    GetOwnerPlate(req: any): Promise<any>;
    GetHoldingChangeList(req: any): Promise<any>;
    GetOptionChain(req: any): Promise<any>;
    GetWarrant(req: any): Promise<any>;
    GetCapitalFlow(req: any): Promise<any>;
    GetCapitalDistribution(req: any): Promise<any>;
    GetUserSecurity(req: any): Promise<any>;
    ModifyUserSecurity(req: any): Promise<any>;
    StockFilter(req: any): Promise<any>;
    GetCodeChange(req: any): Promise<any>;
    GetIpoList(req: any): Promise<any>;
    GetFutureInfo(req: any): Promise<any>;
    RequestTradeDate(req: any): Promise<any>;
    SetPriceReminder(req: any): Promise<any>;
    GetPriceReminder(req: any): Promise<any>;
    GetUserSecurityGroup(req: any): Promise<any>;
    GetMarketState(req: any): Promise<any>;
    GetOptionExpirationDate(req: any): Promise<any>;
    
    // Subscription methods
    Sub(req: any): Promise<any>;
  }
  
  export default mmWebsocket;
}

declare module 'moomoo-api/proto.js' {
  export const Common: {
    RetType: {
      RetType_Succeed: number;
      RetType_Failed: number;
      RetType_TimeOut: number;
      RetType_DisConnect: number;
      RetType_Unknown: number;
      RetType_Invalid: number;
    };
    PacketEncAlgo: any;
    PacketID: any;
    ProtoFmt: any;
    UserAttribution: any;
    ProgramStatusType: any;
    ProgramStatus: any;
    Session: any;
  };
  
  export const Trd_Common: {
    TrdEnv: {
      TrdEnv_Simulate: number;
      TrdEnv_Real: number;
    };
    TrdCategory: {
      TrdCategory_Unknown: number;
      TrdCategory_Security: number;
      TrdCategory_Future: number;
    };
    TrdMarket: {
      TrdMarket_Unknown: number;
      TrdMarket_HK: number;
      TrdMarket_US: number;
      TrdMarket_CN: number;
      TrdMarket_HKCC: number;
      TrdMarket_Futures: number;
      TrdMarket_SG: number;
      TrdMarket_AU: number;
      TrdMarket_JP: number;
      TrdMarket_MY: number;
      TrdMarket_CA: number;
    };
    TrdSecMarket: {
      TrdSecMarket_Unknown: number;
      TrdSecMarket_HK: number;
      TrdSecMarket_US: number;
      TrdSecMarket_CN_SH: number;
      TrdSecMarket_CN_SZ: number;
      TrdSecMarket_SG: number;
      TrdSecMarket_JP: number;
      TrdSecMarket_AU: number;
      TrdSecMarket_MY: number;
      TrdSecMarket_CA: number;
    };
    TrdSide: {
      TrdSide_Unknown: number;
      TrdSide_Buy: number;
      TrdSide_Sell: number;
      TrdSide_SellShort: number;
      TrdSide_BuyBack: number;
    };
    OrderType: any;
    TrailType: any;
    OrderStatus: any;
    OrderFillStatus: any;
    PositionSide: any;
    ModifyOrderOp: any;
    TrdAccType: any;
    TrdAccStatus: any;
    TrdAccRole: any;
    Currency: {
      Currency_Unknown: number;
      Currency_HKD: number;
      Currency_USD: number;
      Currency_CNH: number;
      Currency_JPY: number;
      Currency_SGD: number;
      Currency_AUD: number;
      Currency_CAD: number;
      Currency_MYR: number;
    };
    CltRiskLevel: any;
    TimeInForce: any;
    SecurityFirm: any;
    SimAccType: any;
    CltRiskStatus: any;
    DTStatus: any;
  };
  
  export const Qot_Common: {
    QotMarket: any;
    SecurityType: any;
    PlateSetType: any;
    WarrantType: any;
    OptionType: any;
    IndexOptionType: any;
    OptionAreaType: any;
    QotMarketState: any;
    TradeDateMarket: any;
    TradeDateType: any;
    RehabType: any;
    KLType: any;
    KLFields: any;
    SubType: any;
    TickerDirection: any;
    TickerType: any;
    DarkStatus: any;
    SecurityStatus: any;
    HolderCategory: any;
    PushDataType: any;
    SortField: any;
    Issuer: any;
    IpoPeriod: any;
    PriceType: any;
    WarrantStatus: any;
    CompanyAct: any;
    QotRight: any;
    PriceReminderType: any;
    PriceReminderFreq: any;
    AssetClass: any;
    ExpirationCycle: any;
    OptionStandardType: any;
    OptionSettlementMode: any;
    ExchType: any;
    PeriodType: any;
    PriceReminderMarketStatus: any;
  };
}