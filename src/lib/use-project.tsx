import {
  createContext,
  useContext,
} from "react";

export interface Project {
  name: string;
}

interface ProjectContextValue {
  projects: Project[];
  selected: string | null;
  setSelected: (name: string) => void;
  isLoading: boolean;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
