export interface MarketQuote {
  symbol: string;
  name: string;
  category: 'FOREX' | 'CRYPTO' | 'METALS' | 'INDICES' | 'COMMODITIES';
  lastPrice: number;
  bid: number;
  ask: number;
  dailyChange: number;
  dailyChangePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  timestamp: number;
  status: 'LIVE' | 'DELAYED' | 'CLOSED' | 'SIMULATED';
  sparkline?: number[];
}

export interface InstrumentSpec {
  symbol: string;
  name: string;
  category: 'FOREX' | 'CRYPTO' | 'METALS' | 'INDICES' | 'COMMODITIES';
  pipSize: number;
  contractSize: number;
  lotStep: number;
  minLot: number;
  maxLot: number;
  baseCurrency: string;
  quoteCurrency: string;
}
