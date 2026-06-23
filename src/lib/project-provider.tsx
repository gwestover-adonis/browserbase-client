import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { STORAGE_KEY, setSelectedProject } from "./project-state";

export interface Project {
  name: string;
}

interface ProjectContextValue {
  projects: Project[];
  selected: string | null;
  setSelected: (name: string) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}

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
