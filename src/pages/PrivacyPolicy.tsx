import { Link } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { DocumentContent } from "@/components/TermsContent";
import privacy from "@/data/privacy.md?raw";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <article className="mx-auto max-w-3xl">
        <Link to="/auth" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Auralis
        </Link>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <Link to="/delete-account" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-border px-3 text-sm hover:border-primary">
            <Trash2 className="h-4 w-4" /> Delete account
          </Link>
        </div>
        <DocumentContent content={privacy} />
      </article>
    </main>
  );
}
