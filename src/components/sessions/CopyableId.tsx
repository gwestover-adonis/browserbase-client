import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyableId({
  id,
  truncate = 12,
}: {
  id: string;
  truncate?: number;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 font-mono text-xs hover:text-primary"
      title="Copy full ID"
    >
      <span>{id.slice(0, truncate)}...</span>
      {copied ? (
        <Check className="size-3 text-green-600" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}
