import { SessionsPage } from "@/components/sessions/SessionsPage";
import { Header } from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectProvider } from "@/lib/project-provider";
import { useProject } from "@/lib/use-project";

function AppContent() {
  const { selected } = useProject();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-6">
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
