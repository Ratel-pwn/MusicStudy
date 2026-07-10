import type { AttemptRecord, ReviewRecord } from '../../data/db';
import { SkillOrbit } from './SkillOrbit';
import { buildSkillOrbitItems } from './profileData';

export function ProfilePage({
  attempts = [],
  reviews = [],
}: {
  attempts?: readonly AttemptRecord[];
  reviews?: readonly ReviewRecord[];
}) {
  const skills = buildSkillOrbitItems({ attempts, reviews });
  return (
    <main aria-label="能力轨道" className="profile-page">
      <header className="profile-heading">
        <p>每次练习都会改变轨道</p>
        <h1>六种音乐能力，不必齐步前进</h1>
      </header>
      <SkillOrbit skills={skills} />
    </main>
  );
}
