// Faster guesses are worth more: 500 pts at the start, 100 pts at the buzzer
export function guesserPoints(timeLeft: number, drawTime: number): number {
  return Math.round(100 + 400 * (timeLeft / drawTime));
}

export function drawerPoints(guesserPts: number): number {
  return Math.round(guesserPts * 0.25);
}