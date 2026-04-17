import { Globe, Moon, Sun, Monitor, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/use-theme";
import { useProject } from "@/lib/use-project";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { projects, selected, setSelected, isLoading } = useProject();

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Globe className="size-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-tight">
            Browserbase Client
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isLoading && projects.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <span className="capitalize">{selected}</span>
                    <ChevronDown className="size-3.5 opacity-50" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                {projects.map((p) => (
                  <DropdownMenuItem
                    key={p.name}
                    onClick={() => setSelected(p.name)}
                    className={p.name === selected ? "font-medium text-primary" : ""}
                  >
                    <span className="capitalize">{p.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon">
                  <ThemeIcon className="size-4" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 size-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 size-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 size-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
