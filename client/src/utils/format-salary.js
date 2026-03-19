/**
 * Formats salary strings or numbers into $10k or $60k - 120k format.
 * Skips formatting if the string already contains '$' or 'k'.
 */
export const formatSalary = (salary) => {
  if (!salary) return 'N/A';

  // Check if already formatted (contains $ or k)
  const salaryStr = String(salary).toLowerCase();
  if (salaryStr.includes('$') || salaryStr.includes('k')) {
    return salary;
  }

  // Helper to convert 10000 -> 10k
  const convertToK = (numStr) => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return numStr;
    return num >= 1000 ? `${num / 1000}k` : num.toString();
  };

  // Handle Ranges (e.g., "60000-120000")
  if (salaryStr.includes('-')) {
    const parts = salaryStr.split('-').map((s) => s.trim());
    return `$${convertToK(parts[0])} - ${convertToK(parts[1])}`;
  }

  // Handle Single Figures (e.g., "10000")
  return `$${convertToK(salaryStr)}`;
};
