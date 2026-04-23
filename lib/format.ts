export function compactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function integer(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function timeAgo(value: string | null) {
  if (!value) return "unknown";

  const diff = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.floor(diff / 86_400_000));

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;

  return `${Math.floor(months / 12)} yr ago`;
}
