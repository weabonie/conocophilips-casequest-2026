export const formatNumber = (value, digits = 0) => value == null ? 'unknown' : value.toLocaleString('en-US', { maximumFractionDigits: digits })
