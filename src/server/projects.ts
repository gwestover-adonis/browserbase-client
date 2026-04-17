const ENV_PREFIX = "BROWSERBASE_API_KEY_";

export interface Project {
  name: string;
}

const projectKeys = new Map<string, string>();

for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith(ENV_PREFIX) && value) {
    const name = key.slice(ENV_PREFIX.length).toLowerCase();
    projectKeys.set(name, value);
  }
}

if (projectKeys.size === 0) {
  console.error(
    "\n✖  No Browserbase project keys found.\n" +
    "   Define at least one BROWSERBASE_API_KEY_<NAME> variable in .env.\n" +
    "   Example: BROWSERBASE_API_KEY_DEVELOPMENT=bb_live_...\n",
  );
  process.exit(1);
}

export function getProjects(): Project[] {
  return Array.from(projectKeys.keys()).map((name) => ({ name }));
}

export function getApiKeyForProject(project: string): string {
  const key = projectKeys.get(project.toLowerCase());
  if (!key) {
    throw new Error(`Unknown project: "${project}"`);
  }
  return key;
}
