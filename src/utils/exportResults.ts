/**
 * Clipboard and data formatting utilities.
 */

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function rowsToCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
  const headerLine = headers.map(esc).join(',');
  const bodyLines = rows.map((row) => row.map(esc).join(','));
  return [headerLine, ...bodyLines].join('\n');
}


