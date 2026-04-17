import { useCallback, useEffect, useState, type ReactNode } from "react";
import { STORAGE_KEY, setSelectedProject } from "./project-state";
import { ProjectContext, type Project } from "./use-project";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelectedState] = useState<string | null>(
    localStorage.getItem(STORAGE_KEY),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json() as Promise<Project[]>)
      .then((data) => {
        setProjects(data);

        const stored = localStorage.getItem(STORAGE_KEY);
        const valid = data.some((p) => p.name === stored);
        const initial = valid ? stored! : data[0]?.name ?? null;

        if (initial) {
          setSelectedState(initial);
          setSelectedProject(initial);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setSelected = useCallback((name: string) => {
    setSelectedState(name);
    setSelectedProject(name);
  }, []);

  return (
    <ProjectContext.Provider value={{ projects, selected, setSelected, isLoading }}>
      {children}
    </ProjectContext.Provider>
  );
}
