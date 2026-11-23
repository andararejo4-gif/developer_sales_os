import { THE_PARK_99_POINTS, type LoveLetterPoint } from './points-data';
import { loadPersistedState, savePersistedState } from '../navigation/router';

export function getLoveLetterPoints(projectId: string): LoveLetterPoint[] | null {
  const isPark = projectId === 'the-park-sukoharjo' || projectId === 'proj-the-park-01';
  if (isPark) return THE_PARK_99_POINTS;

  return loadPersistedState<LoveLetterPoint[] | null>(`devos_loveletter_points_${projectId}`, null);
}

export function initProjectLoveLetter(
  projectId: string,
  projectName: string,
  projectLocation: string = 'Sukoharjo',
  _projectType: string = 'Menengah'
): LoveLetterPoint[] {
  // Generate 99 poin faktual terkurasi khusus proyek dari template berstruktur 6 bab
  const points: LoveLetterPoint[] = THE_PARK_99_POINTS.map((pt) => {
    const narrative = pt.narrative
      .replace(/The Park Townhouse Sukoharjo|The Park Townhouse/g, projectName)
      .replace(/Solo Baru/g, projectLocation);
    const title = pt.title
      .replace(/The Park Townhouse Sukoharjo|The Park Townhouse/g, projectName)
      .replace(/Solo Baru/g, projectLocation);

    return {
      ...pt,
      title,
      narrative,
    };
  });

  savePersistedState(`devos_loveletter_points_${projectId}`, points);
  return points;
}
