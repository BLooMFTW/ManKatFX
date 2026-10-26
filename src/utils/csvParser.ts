import { Trade } from '../types/trade';

export function exportTradesToCSV(trades: Trade[]): string {
  const headers = [
    'ID',
    'Date',
    'Time',
    'Symbol',
    'Asset Class',
    'Direction',
    'Status',
    'Entry Price',
    'Exit Price',
    'Stop Loss',
    'Take Profit',
    'Quantity',
    'Lot Size',
    'Gross PnL',
    'Net PnL',
    'Planned RR',
    'Realized RR',
    'Strategy',
    'Setup Type',
    'Emotion Before',
    'Emotion After',
    'Rule Score',
    'Mistakes',
    'Lessons',
    'Notes',
  ];

  const rows = trades.map((t) => [
    t.id,
    t.entryDate,
    t.entryTime || '',
    t.symbol,
    t.assetClass,
    t.direction,
    t.status,
    t.entryPrice,
    t.exitPrice ?? '',
    t.stopLoss ?? '',
    t.takeProfit ?? '',
    t.quantity,
    t.lotSize ?? '',
    t.grossPnL,
    t.netPnL,
    t.plannedRR ?? '',
    t.realizedRR ?? '',
    `"${(t.strategy || '').replace(/"/g, '""')}"`,
    `"${(t.setupType || '').replace(/"/g, '""')}"`,
    t.emotionBefore || '',
    t.emotionAfter || '',
    t.ruleFollowingScore ?? '',
    `"${(t.mistakes || '').replace(/"/g, '""')}"`,
    `"${(t.lessons || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function parseCSVToTrades(csvText: string, userId: string, accountId: string): Trade[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

  const parsedTrades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV row parser handling quotes
    const values: string[] = [];
    let insideQuote = false;
    let currentVal = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' && (c === 0 || line[c - 1] !== '\\')) {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^"|"$/g, ''));

    // Map fields
    const getVal = (colNames: string[]): string => {
      for (const name of colNames) {
        const idx = headers.findIndex((h) => h.includes(name));
        if (idx !== -1 && values[idx] !== undefined) return values[idx];
      }
      return '';
    };

    const symbol = getVal(['symbol', 'instrument', 'pair']) || 'UNKNOWN';
    const direction = (getVal(['direction', 'type', 'side']).toUpperCase().includes('SHORT') ? 'SHORT' : 'LONG') as any;
    const entryPrice = parseFloat(getVal(['entry price', 'open price', 'entry', 'price'])) || 1;
    const exitPrice = parseFloat(getVal(['exit price', 'close price', 'exit'])) || undefined;
    const date = getVal(['date', 'time', 'entry date']) || new Date().toISOString().split('T')[0];
    const netPnL = parseFloat(getVal(['net pnl', 'pnl', 'profit', 'gain'])) || 0;
    const quantity = parseFloat(getVal(['quantity', 'volume', 'size', 'lots'])) || 1;

    parsedTrades.push({
      id: `imp_${Date.now()}_${i}`,
      userId,
      accountId,
      symbol: symbol.toUpperCase(),
      assetClass: symbol.includes('BTC') || symbol.includes('ETH') ? 'CRYPTO' : symbol.includes('XAU') ? 'METALS' : 'FOREX',
      direction,
      status: exitPrice ? 'CLOSED' : 'OPEN',
      entryDate: date.substring(0, 10),
      entryTime: '12:00',
      entryPrice,
      exitPrice,
      quantity,
      commission: 0,
      swap: 0,
      grossPnL: netPnL,
      netPnL,
      ruleFollowingScore: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return parsedTrades;
}
