export function formatNumber(num, options = {}) {
  if (num === null) {
    return null;
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 2, ...options });
}
