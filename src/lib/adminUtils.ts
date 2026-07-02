/** Admin page utilities — extracted from Admin.tsx */

/** Strip any currency symbols ($, ₴, €, etc.) from a price string */
export function cleanPrice(price: string): string {
  return price.replace(/[$₴€£¥]/g, '').trim();
}

/** Parse DD/MM/YYYY to Date */
export function parseDate(dateStr: string): Date | null {
  try {
    const [day, month, year] = dateStr.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
}

/** Format Date to DD/MM/YYYY */
export function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Calculate days until expiry from YYYY-MM-DD or DD/MM/YYYY */
export function getDaysUntilExpiry(endDateStr: string): number {
  try {
    let endDate: Date;
    if (endDateStr.includes('-')) {
      endDate = new Date(endDateStr);
    } else {
      const [day, month, year] = endDateStr.split('/').map(Number);
      endDate = new Date(year, month - 1, day);
    }
    if (isNaN(endDate.getTime())) return -1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return -1;
  }
}

/** Check if subscription is still active */
export function isSubscriptionActive(endDateStr: string): boolean {
  return getDaysUntilExpiry(endDateStr) >= 0;
}
