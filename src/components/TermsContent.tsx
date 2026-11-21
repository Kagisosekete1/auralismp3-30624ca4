import terms from "@/data/terms.md?raw";

export function DocumentContent({ content }: { content: string }) {
  const formatInline = (text: string) => text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={index} className="text-foreground">{part.slice(2, -2)}</strong> : part,
  );
  return <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
    {content.replace(/(^#{1,4} [^\n]+)\n(?=#{1,4} )/gm, "$1\n\n").split(/\n\s*\n/).map((block, index) => {
      if (block.startsWith("#### ")) return <h4 key={index} className="pt-2 text-sm font-semibold text-foreground">{block.slice(5)}</h4>;
      if (block.startsWith("### ")) return <h3 key={index} className="pt-3 text-base font-semibold text-foreground">{block.slice(4)}</h3>;
      if (block.startsWith("## ")) return <h2 key={index} className="text-lg font-bold text-foreground">{block.slice(3)}</h2>;
      if (block.startsWith("# ")) return <h1 key={index} className="text-xl font-bold text-foreground">{block.slice(2)}</h1>;
      if (block.startsWith("- ")) return <ul key={index} className="list-disc space-y-1 pl-5">{block.split("\n").map((line, i) => <li key={i}>{line.slice(2)}</li>)}</ul>;
      return <p key={index} className="whitespace-pre-line">{formatInline(block)}</p>;
    })}
  </div>;
}

export function TermsContent() {
  return <DocumentContent content={terms} />;
}
