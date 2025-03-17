/**
 * Formats a string by replacing placeholders with values
 * @param str The string with placeholders in the format {key}
 * @param params Object containing key-value pairs to replace in the string
 * @returns Formatted string with placeholders replaced by values
 */
export function formatString(str: string, params: Record<string, string | number>): string {
  return str.replace(/{([^{}]+)}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
} 