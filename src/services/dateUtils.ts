/**
 * Takes DD/MM/YYYY and converts to ISO YYYY-MM-DD for DB storage.
 * Returns empty string if invalid format.
 */
export const dateToISO = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    if (day.length === 2 && month.length === 2 && year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }
  return '';
};

/**
 * Takes ISO YYYY-MM-DD and converts to locale UI DD/MM/YYYY.
 */
export const dateToUI = (isoStr: string): string => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

/**
 * Get current date in DD/MM/YYYY
 */
export const getTodayUI = (): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
