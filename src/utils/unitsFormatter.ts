export function unitsFormatter(bytes: number): string {
  const megaBytes = bytes / (1024 * 1024);

  if (megaBytes < 1024) {
    return `${megaBytes.toFixed(2)}MB`;
  }

  const gigaBytes = megaBytes / 1024;
  return `${gigaBytes.toFixed(2)}GB`;
}
