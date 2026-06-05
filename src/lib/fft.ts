export interface FrequencyPeak {
  periodMinutes: number;
  periodLabel: string;
  power: number;
  rank: number;
}

export interface SpectrumPoint {
  periodMinutes: number;
  power: number;
  isPeak?: boolean;
}

export interface FrequencyAnalysis {
  dominantPeriods: FrequencyPeak[];
  spectrum: SpectrumPoint[];
}

function nextPowerOf2(n: number): number {
  return 1 << Math.ceil(Math.log2(n));
}

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Butterfly stages
  for (let len = 2; len <= n; len *= 2) {
    const halfLen = len / 2;
    const angle = (-2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let j = 0; j < halfLen; j++) {
        const u = i + j;
        const v = u + halfLen;
        const tRe = curRe * re[v] - curIm * im[v];
        const tIm = curRe * im[v] + curIm * re[v];
        re[v] = re[u] - tRe;
        im[v] = im[u] - tIm;
        re[u] += tRe;
        im[u] += tIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

export function formatPeriod(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hr`;
  return `${(minutes / 1440).toFixed(1)} days`;
}

export function analyzeFrequency(minutePeaks: number[], totalMinutes: number): FrequencyAnalysis | null {
  if (totalMinutes < 30) return null;

  const signal = new Float64Array(minutePeaks.slice(0, totalMinutes));

  // DC removal
  let sum = 0;
  for (let i = 0; i < signal.length; i++) sum += signal[i];
  const mean = sum / signal.length;
  for (let i = 0; i < signal.length; i++) signal[i] -= mean;

  // Hann window
  const N = signal.length;
  for (let i = 0; i < N; i++) {
    signal[i] *= 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
  }

  // Zero-pad to next power of 2
  const fftSize = nextPowerOf2(N);
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);
  re.set(signal);

  fft(re, im);

  // Power spectrum (bins 1..fftSize/2)
  const halfN = fftSize / 2;
  const minPeriod = 5;
  const maxPeriod = totalMinutes / 3;

  const raw: SpectrumPoint[] = [];
  let maxPower = 0;

  for (let k = 1; k <= halfN; k++) {
    const period = fftSize / k;
    if (period < minPeriod || period > maxPeriod) continue;
    const power = re[k] * re[k] + im[k] * im[k];
    if (power > maxPower) maxPower = power;
    raw.push({ periodMinutes: period, power });
  }

  if (maxPower === 0) return { dominantPeriods: [], spectrum: [] };

  // Normalize
  for (const p of raw) p.power /= maxPower;

  // Sort by period descending (long periods on left)
  raw.sort((a, b) => b.periodMinutes - a.periodMinutes);

  // Peak detection: local maxima above noise floor
  const peaks: FrequencyPeak[] = [];
  const peakIndices = new Set<number>();
  for (let i = 1; i < raw.length - 1; i++) {
    if (raw[i].power > raw[i - 1].power && raw[i].power > raw[i + 1].power && raw[i].power > 0.05) {
      peaks.push({
        periodMinutes: raw[i].periodMinutes,
        periodLabel: formatPeriod(raw[i].periodMinutes),
        power: raw[i].power,
        rank: 0,
      });
      peakIndices.add(i);
    }
  }

  peaks.sort((a, b) => b.power - a.power);
  const topPeaks = peaks.slice(0, 8);
  for (let i = 0; i < topPeaks.length; i++) topPeaks[i].rank = i + 1;

  // Mark top 5 peaks in the spectrum
  const topPeriods = new Set(topPeaks.slice(0, 5).map((p) => p.periodMinutes));
  for (const idx of peakIndices) {
    if (topPeriods.has(raw[idx].periodMinutes)) {
      raw[idx].isPeak = true;
    }
  }

  // Downsample spectrum for chart, always preserving peak bins
  let spectrum = raw;
  if (spectrum.length > 500) {
    const step = Math.ceil(spectrum.length / 500);
    spectrum = spectrum.filter((p, i) => p.isPeak || i % step === 0);
  }

  return { dominantPeriods: topPeaks, spectrum };
}
