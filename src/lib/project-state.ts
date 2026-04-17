const STORAGE_KEY = "browserbase-project";

let currentProject: string | null = localStorage.getItem(STORAGE_KEY);

export function getSelectedProject(): string | null {
  return currentProject;
}

export function setSelectedProject(name: string) {
  currentProject = name;
  localStorage.setItem(STORAGE_KEY, name);
}

export { STORAGE_KEY };
