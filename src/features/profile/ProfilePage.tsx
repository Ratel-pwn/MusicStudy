import { SkillOrbit, type SkillOrbitItem } from './SkillOrbit';

export function ProfilePage({ skills }: { skills: readonly SkillOrbitItem[] }) {
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
