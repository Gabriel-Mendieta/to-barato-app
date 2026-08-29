const MIN_MS = 300;
const MAX_MS = 800;

let delayOverride: number | null = null;

export function setMockDelayMs(ms: number | null): void {
  delayOverride = ms;
}

export async function mockDelay(): Promise<void> {
  const ms =
    delayOverride ??
    Math.floor(Math.random() * (MAX_MS - MIN_MS + 1)) + MIN_MS;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
