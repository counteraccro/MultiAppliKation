/** Durée lisible par un enfant, au dixième : « 42,3 s », « 1 min 05,3 s ». */
export function formatDuration(ms: number): string {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = (tenths % 600) / 10;
  const secondsText = seconds.toFixed(1).replace('.', ',');
  if (minutes === 0) return `${secondsText} s`;
  return `${minutes} min ${secondsText.padStart(4, '0')} s`;
}
