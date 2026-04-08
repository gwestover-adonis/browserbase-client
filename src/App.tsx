import { SessionsPage } from "@/components/sessions/SessionsPage";
import { Header } from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <SessionsPage />
        </main>
      </div>
    </TooltipProvider>
  );
}

export default App;
