import { SessionsPage } from "@/components/sessions/SessionsPage";
import { Header } from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectProvider, useProject } from "@/lib/project-provider";

function AppContent() {
  const { selected } = useProject();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden container mx-auto px-4 py-6">
        {selected && <SessionsPage key={selected} />}
      </main>
    </div>
  );
}

function App() {
  return (
    <ProjectProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </ProjectProvider>
  );
}

export default App;
