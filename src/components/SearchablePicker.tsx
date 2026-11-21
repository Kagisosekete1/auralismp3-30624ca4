import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface PickerOption {
  value: string;
  label: string;
  prefix?: string;
}

interface SearchablePickerProps {
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  title: string;
  placeholder?: string;
  emptyLabel?: string;
  optional?: boolean;
}

export default function SearchablePicker({ value, options, onChange, title, placeholder, emptyLabel, optional }: SearchablePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return options.filter((option) => `${option.label} ${option.value}`.toLocaleLowerCase().includes(needle));
  }, [options, query]);

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
      <button type="button" onClick={() => setOpen(true)} className="w-full flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated/50 px-4 py-3 text-left text-foreground">
        <span className="truncate">{selected ? <>{selected.prefix && <span className="mr-2">{selected.prefix}</span>}{selected.label}</> : (emptyLabel || `Select ${title.toLowerCase()}`)}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
      </button>
      <DialogContent className="flex max-h-[min(82dvh,720px)] w-[calc(100%-2rem)] max-w-md flex-col gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-[#07120f] p-5 text-foreground shadow-[0_24px_90px_rgba(0,0,0,.72)]">
        <DialogTitle className="pr-8 text-left text-lg">{title}</DialogTitle>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-primary/60">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder || `Search ${title.toLowerCase()}...`} aria-label={`Search ${title.toLowerCase()}`} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </label>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1" role="listbox" aria-label={title}>
          {optional && <button type="button" role="option" aria-selected={!value} onClick={() => choose("")} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-muted-foreground hover:bg-primary/10">None{!value && <Check className="h-4 w-4 text-primary" />}</button>}
          {matches.map((option) => <button key={option.value} type="button" role="option" aria-selected={value === option.value} onClick={() => choose(option.value)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <span className="truncate">{option.prefix && <span className="mr-2">{option.prefix}</span>}{option.label}</span>
            {value === option.value && <Check className="h-4 w-4 shrink-0 text-primary" />}
          </button>)}
          {matches.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matches found</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
