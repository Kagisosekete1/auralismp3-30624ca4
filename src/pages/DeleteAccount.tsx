import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldAlert, Trash2 } from "lucide-react";

export default function DeleteAccount() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <article className="mx-auto max-w-2xl">
        <Link to="/auth" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Auralis
        </Link>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><Trash2 /></div>
        <p className="text-sm font-medium text-primary">Auralis · Se-Mo Group Tech</p>
        <h1 className="mt-2 text-3xl font-bold">Delete your account</h1>
        <p className="mt-3 text-muted-foreground">You can permanently delete your Auralis account and its associated app data from inside the app. This action cannot be undone.</p>

        <section className="mt-8 space-y-4 rounded-2xl border border-border bg-card/50 p-5">
          <h2 className="text-lg font-semibold">From the app</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Sign in to the account you want to delete.</li>
            <li>Open <strong className="text-foreground">Profile → Settings → Danger Zone</strong>.</li>
            <li>Choose <strong className="text-foreground">Delete my account</strong> and confirm the permanent deletion.</li>
          </ol>
          <p className="text-sm text-muted-foreground">The in-app action removes the account, profile, playlists, follows, likes, listening/activity rows, messages and posts linked to the account, and the account’s uploaded audio, cover art, avatar and reels. Public tracks owned by that artist are removed as well.</p>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card/50 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5 text-primary" /> Retention and exceptions</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Deletion is permanent after the app confirms completion. Auralis may retain limited records where required by law or reasonably necessary to resolve disputes, protect the service, or prevent fraud. Backups and third-party systems may take additional time to expire under their own retention cycles. If deletion cannot be completed in the app, contact support from the email address on your account; support may ask you to verify account ownership.</p>
        </section>

        <a href="mailto:semogrouptech@gmail.com?subject=Auralis%20account%20deletion%20request" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:opacity-90">
          <Mail className="h-4 w-4" /> Contact account support
        </a>
        <p className="mt-4 text-center text-xs text-muted-foreground">Auralis is operated by Se-Mo Group Tech · Sandton, Johannesburg, South Africa</p>
        <p className="mt-2 text-center text-xs text-muted-foreground"><Link to="/privacy-policy" className="underline">Privacy Policy</Link> · semogrouptech@gmail.com</p>
      </article>
    </main>
  );
}
