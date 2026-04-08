import { Plus, Trash2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { MetadataCondition } from "@/lib/metadata-query";
import { createCondition } from "@/lib/metadata-query";

interface MetadataQueryBuilderProps {
  conditions: MetadataCondition[];
  onChange: (conditions: MetadataCondition[]) => void;
  onSearch: () => void;
  keyPaths: string[];
  valuesForKey: (keyPath: string) => string[];
}

export function MetadataQueryBuilder({
  conditions,
  onChange,
  onSearch,
  keyPaths,
  valuesForKey,
}: MetadataQueryBuilderProps) {
  function updateCondition(
    id: string,
    field: "keyPath" | "value",
    val: string,
  ) {
    onChange(
      conditions.map((c) => (c.id === id ? { ...c, [field]: val } : c)),
    );
  }

  function removeCondition(id: string) {
    const next = conditions.filter((c) => c.id !== id);
    onChange(next.length > 0 ? next : [createCondition()]);
  }

  function addCondition() {
    onChange([...conditions, createCondition()]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium">Metadata Filters</label>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="inline-flex text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="size-3.5" />
              </button>
            }
          />
          <TooltipContent side="right">
            <p>
              Use dot notation for nested keys.
              <br />
              e.g. <code className="font-mono">order.status</code> matches{" "}
              <code className="font-mono">
                {"user_metadata['order']['status']"}
              </code>
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-1.5">
        {conditions.map((condition, idx) => (
          <ConditionRow
            key={condition.id}
            condition={condition}
            index={idx}
            showSpacer={idx === 0 && conditions.length > 1}
            keyPaths={keyPaths}
            valueSuggestions={valuesForKey(condition.keyPath)}
            onUpdateKeyPath={(val) =>
              updateCondition(condition.id, "keyPath", val)
            }
            onUpdateValue={(val) =>
              updateCondition(condition.id, "value", val)
            }
            onRemove={() => removeCondition(condition.id)}
            onSearch={onSearch}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="xs"
        onClick={addCondition}
        className="text-muted-foreground"
      >
        <Plus className="size-3.5" />
        Add condition
      </Button>
    </div>
  );
}

function ConditionRow({
  condition,
  index,
  showSpacer,
  keyPaths,
  valueSuggestions,
  onUpdateKeyPath,
  onUpdateValue,
  onRemove,
  onSearch,
}: {
  condition: MetadataCondition;
  index: number;
  showSpacer: boolean;
  keyPaths: string[];
  valueSuggestions: string[];
  onUpdateKeyPath: (val: string) => void;
  onUpdateValue: (val: string) => void;
  onRemove: () => void;
  onSearch: () => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") onSearch();
  }

  return (
    <div className="flex items-center gap-2">
      {index > 0 && (
        <span className="w-8 shrink-0 text-center text-xs font-medium text-muted-foreground">
          AND
        </span>
      )}
      {showSpacer && <span className="w-8 shrink-0" />}

      <Combobox
        items={keyPaths}
        value={condition.keyPath || null}
        onValueChange={(val) => onUpdateKeyPath(val ?? "")}
        onInputValueChange={(inputVal) => onUpdateKeyPath(inputVal)}
      >
        <ComboboxInput
          placeholder="key.path (e.g. env)"
          onKeyDown={handleKeyDown}
          className="flex-1 font-mono text-sm"
          showTrigger={keyPaths.length > 0}
        />
        {keyPaths.length > 0 && (
          <ComboboxContent>
            <ComboboxEmpty>No matching keys.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item} className="font-mono text-sm">
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        )}
      </Combobox>

      <span className="shrink-0 text-xs text-muted-foreground">=</span>

      <Combobox
        items={valueSuggestions}
        value={condition.value || null}
        onValueChange={(val) => onUpdateValue(val ?? "")}
        onInputValueChange={(inputVal) => onUpdateValue(inputVal)}
      >
        <ComboboxInput
          placeholder="value"
          onKeyDown={handleKeyDown}
          className="flex-1 font-mono text-sm"
          showTrigger={valueSuggestions.length > 0}
        />
        {valueSuggestions.length > 0 && (
          <ComboboxContent>
            <ComboboxEmpty>No matching values.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item} className="font-mono text-sm">
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        )}
      </Combobox>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        title="Remove condition"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
