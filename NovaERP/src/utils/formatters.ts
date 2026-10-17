/**
 * Format a date string to a localized display format.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

/**
 * Format a date string to include time.
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

/**
 * Format a number as currency (defaults to USD or given currency).
 */
export function formatCurrency(amount: number | string | null | undefined, currency: string = "USD"): string {
  const num = typeof amount === "number" ? amount : (amount ? Number(amount) : 0);
  const validNum = isNaN(num) ? 0 : num;
  const currCode = (currency && typeof currency === "string" && currency.length === 3) ? currency.toUpperCase() : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNum);
  } catch {
    return `$${validNum.toFixed(2)}`;
  }
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Format a number cleanly.
 */
export function formatNumber(num: number | string | null | undefined): string {
  const val = typeof num === "number" ? num : (num ? Number(num) : 0);
  const validNum = isNaN(val) ? 0 : val;
  return new Intl.NumberFormat("en-US").format(validNum);
}

