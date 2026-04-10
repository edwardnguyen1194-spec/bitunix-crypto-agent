/**
 * Technical Analysis Engine
 * RSI, MACD, EMA, SMA, Bollinger Bands, ATR, VWAP, Stochastic, ADX, OBV
 */

class TechnicalAnalysis {
  static SMA(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
    return result;
  }

  static EMA(data, period) {
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  }

  static RSI(closes, period = 14) {
    const changes = [];
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }

    let avgGain = 0, avgLoss = 0;
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) avgGain += changes[i];
      else avgLoss += Math.abs(changes[i]);
    }
    avgGain /= period;
    avgLoss /= period;

    const rsi = [avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))];

    for (let i = period; i < changes.length; i++) {
      const gain = changes[i] > 0 ? changes[i] : 0;
      const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
    }
    return rsi;
  }

  static MACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.EMA(closes, fastPeriod);
    const slowEMA = this.EMA(closes, slowPeriod);

    const macdLine = [];
    for (let i = 0; i < closes.length; i++) {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }

    const signalLine = this.EMA(macdLine, signalPeriod);
    const histogram = macdLine.map((v, i) => v - signalLine[i]);

    return { macd: macdLine, signal: signalLine, histogram };
  }

  static BollingerBands(closes, period = 20, stdDev = 2) {
    const sma = this.SMA(closes, period);
    const upper = [], lower = [], bandwidth = [];

    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const sd = Math.sqrt(variance) * stdDev;
      upper.push(mean + sd);
      lower.push(mean - sd);
      bandwidth.push((2 * sd) / mean * 100);
    }

    return { upper, middle: sma, lower, bandwidth };
  }

  static ATR(highs, lows, closes, period = 14) {
    const tr = [highs[0] - lows[0]];
    for (let i = 1; i < closes.length; i++) {
      tr.push(Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      ));
    }
    return this.EMA(tr, period);
  }

  static Stochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
    const k = [];
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const highSlice = highs.slice(i - kPeriod + 1, i + 1);
      const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
      const hh = Math.max(...highSlice);
      const ll = Math.min(...lowSlice);
      k.push(hh === ll ? 50 : ((closes[i] - ll) / (hh - ll)) * 100);
    }
    const d = this.SMA(k, dPeriod);
    return { k, d };
  }

  static ADX(highs, lows, closes, period = 14) {
    const plusDM = [], minusDM = [], tr = [];
    for (let i = 1; i < closes.length; i++) {
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];
      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
      tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
    }

    const smoothTR = this.EMA(tr, period);
    const smoothPlusDM = this.EMA(plusDM, period);
    const smoothMinusDM = this.EMA(minusDM, period);

    const plusDI = smoothPlusDM.map((v, i) => (v / smoothTR[i]) * 100);
    const minusDI = smoothMinusDM.map((v, i) => (v / smoothTR[i]) * 100);
    const dx = plusDI.map((v, i) => (Math.abs(v - minusDI[i]) / (v + minusDI[i])) * 100);
    const adx = this.EMA(dx, period);

    return { adx, plusDI, minusDI };
  }

  static OBV(closes, volumes) {
    const obv = [0];
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) obv.push(obv[i - 1] + volumes[i]);
      else if (closes[i] < closes[i - 1]) obv.push(obv[i - 1] - volumes[i]);
      else obv.push(obv[i - 1]);
    }
    return obv;
  }

  static VWAP(highs, lows, closes, volumes) {
    const vwap = [];
    let cumVolume = 0, cumVP = 0;
    for (let i = 0; i < closes.length; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      cumVolume += volumes[i];
      cumVP += typicalPrice * volumes[i];
      vwap.push(cumVolume === 0 ? typicalPrice : cumVP / cumVolume);
    }
    return vwap;
  }

  static SuperTrend(highs, lows, closes, period = 10, multiplier = 3) {
    const atr = this.ATR(highs, lows, closes, period);
    const supertrend = [];
    const direction = [];

    for (let i = 0; i < closes.length; i++) {
      const hl2 = (highs[i] + lows[i]) / 2;
      const upperBand = hl2 + multiplier * (atr[i] || atr[0]);
      const lowerBand = hl2 - multiplier * (atr[i] || atr[0]);

      if (i === 0) {
        supertrend.push(upperBand);
        direction.push(-1);
        continue;
      }

      const prevST = supertrend[i - 1];
      const prevDir = direction[i - 1];

      if (prevDir === -1 && closes[i] > prevST) {
        supertrend.push(lowerBand);
        direction.push(1);
      } else if (prevDir === 1 && closes[i] < prevST) {
        supertrend.push(upperBand);
        direction.push(-1);
      } else if (prevDir === 1) {
        supertrend.push(Math.max(lowerBand, prevST));
        direction.push(1);
      } else {
        supertrend.push(Math.min(upperBand, prevST));
        direction.push(-1);
      }
    }
    return { supertrend, direction };
  }

  static IchimokuCloud(highs, lows, closes, convPeriod = 9, basePeriod = 26, spanBPeriod = 52) {
    const highestHigh = (arr, start, period) => {
      const slice = arr.slice(Math.max(0, start - period + 1), start + 1);
      return Math.max(...slice);
    };
    const lowestLow = (arr, start, period) => {
      const slice = arr.slice(Math.max(0, start - period + 1), start + 1);
      return Math.min(...slice);
    };

    const tenkan = [], kijun = [], spanA = [], spanB = [];
    for (let i = 0; i < closes.length; i++) {
      const t = (highestHigh(highs, i, convPeriod) + lowestLow(lows, i, convPeriod)) / 2;
      const k = (highestHigh(highs, i, basePeriod) + lowestLow(lows, i, basePeriod)) / 2;
      tenkan.push(t);
      kijun.push(k);
      spanA.push((t + k) / 2);
      spanB.push((highestHigh(highs, i, spanBPeriod) + lowestLow(lows, i, spanBPeriod)) / 2);
    }
    return { tenkan, kijun, spanA, spanB };
  }

  /**
   * Compute full analysis snapshot for a candle set
   */
  static analyze(candles) {
    if (candles.length < 52) return null;

    const closes = candles.map(c => parseFloat(c.close));
    const highs = candles.map(c => parseFloat(c.high));
    const lows = candles.map(c => parseFloat(c.low));
    const volumes = candles.map(c => parseFloat(c.quoteVol || c.baseVol || 0));

    const rsi = this.RSI(closes);
    const macd = this.MACD(closes);
    const bb = this.BollingerBands(closes);
    const atr = this.ATR(highs, lows, closes);
    const stoch = this.Stochastic(highs, lows, closes);
    const adx = this.ADX(highs, lows, closes);
    const obv = this.OBV(closes, volumes);
    const vwap = this.VWAP(highs, lows, closes, volumes);
    const supertrend = this.SuperTrend(highs, lows, closes);
    const ema9 = this.EMA(closes, 9);
    const ema21 = this.EMA(closes, 21);
    const ema50 = this.EMA(closes, 50);
    const ichimoku = this.IchimokuCloud(highs, lows, closes);

    const last = closes.length - 1;
    return {
      price: closes[last],
      rsi: rsi[rsi.length - 1],
      macd: {
        value: macd.macd[last],
        signal: macd.signal[last],
        histogram: macd.histogram[last],
      },
      bb: {
        upper: bb.upper[bb.upper.length - 1],
        middle: bb.middle[bb.middle.length - 1],
        lower: bb.lower[bb.lower.length - 1],
        bandwidth: bb.bandwidth[bb.bandwidth.length - 1],
      },
      atr: atr[last],
      stochastic: { k: stoch.k[stoch.k.length - 1], d: stoch.d[stoch.d.length - 1] },
      adx: {
        value: adx.adx[adx.adx.length - 1],
        plusDI: adx.plusDI[adx.plusDI.length - 1],
        minusDI: adx.minusDI[adx.minusDI.length - 1],
      },
      obv: obv[last],
      vwap: vwap[last],
      supertrend: {
        value: supertrend.supertrend[last],
        direction: supertrend.direction[last],
      },
      ema: { ema9: ema9[last], ema21: ema21[last], ema50: ema50[last] },
      ichimoku: {
        tenkan: ichimoku.tenkan[last],
        kijun: ichimoku.kijun[last],
        spanA: ichimoku.spanA[last],
        spanB: ichimoku.spanB[last],
      },
      volume: volumes[last],
      avgVolume: volumes.slice(-20).reduce((a, b) => a + b, 0) / 20,
    };
  }
}

module.exports = { TechnicalAnalysis };
