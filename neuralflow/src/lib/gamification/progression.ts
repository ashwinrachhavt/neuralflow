export function priorityToPoints(priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null): number {
  if (priority === 'HIGH') return 3;
  if (priority === 'MEDIUM') return 2;
  return 1; // LOW or undefined
}

// Generate milestone thresholds following the pattern:
// 1,2,5,10,15,20,25 up to 50, then +10 steps (60,70,...)
export function generateMilestones(count: number): number[] {
  const base = [1, 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const res: number[] = [];
  for (let i = 0; i < count; i++) {
    if (i < base.length) res.push(base[i]);
    else res.push(50 + (i - (base.length - 1)) * 10);
  }
  return res;
}

export function unlockedCount(points: number, milestones: number[]): number {
  let c = 0;
  for (const m of milestones) {
    if (points >= m) c++;
    else break;
  }
  return c;
}

