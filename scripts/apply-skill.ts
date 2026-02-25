import fs from 'fs';
import { applySkill } from '../skills-engine/apply.js';
import { initSkillsSystem } from '../skills-engine/migrate.js';

const skillDir = process.argv[2];
if (!skillDir) {
  console.error('Usage: tsx scripts/apply-skill.ts <skill-dir>');
  process.exit(1);
}

// Auto-init if .nanoclaw/state.yaml doesn't exist
if (!fs.existsSync('.nanoclaw/state.yaml')) {
  initSkillsSystem();
}

const result = await applySkill(skillDir);
console.log(JSON.stringify(result, null, 2));

if (!result.success) {
  process.exit(1);
}
