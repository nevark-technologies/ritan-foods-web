import { BadgeCheck } from "lucide-react";
import { moderateReviewAction } from "@/app/admin/actions";
import { AdminHeader, Badge, Card } from "@/components/admin/AdminShell";
import { Stars } from "@/components/product/Stars";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Reviews" };

export default async function AdminReviews() {
  await requireAdmin();
  const [reviews, products] = await Promise.all([store.listReviews(), store.listProducts({ includeInactive: true })]);
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? "Product";
  const pending = reviews.filter((r) => !r.isApproved);
  const live = reviews.filter((r) => r.isApproved);

  const Row = ({ r }: { r: (typeof reviews)[number] }) => (
    <li className="flex flex-col gap-3 border-t border-forest-900/5 py-5 first:border-t-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Stars value={r.rating} />
          <span className="text-sm font-semibold text-forest-900">{name(r.productId)}</span>
          {r.isDemo && <Badge value="pending" label="Sample" />}
          {r.verifiedPurchase && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-leaf-600">
              <BadgeCheck className="size-3.5" /> Verified
            </span>
          )}
        </div>
        {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
        <p className="mt-1 text-sm text-ink-700">{r.body}</p>
        <p className="mt-2 text-xs text-ink-500">
          {r.authorName} · {formatDate(r.createdAt)}
        </p>
      </div>
      <form action={moderateReviewAction} className="flex shrink-0 gap-2">
        <input type="hidden" name="id" value={r.id} />
        {r.isApproved ? (
          <button name="op" value="hide" className="rounded-full bg-parchment-100 px-4 py-2 text-xs font-semibold text-forest-800">
            Hide
          </button>
        ) : (
          <button name="op" value="approve" className="rounded-full bg-forest-800 px-4 py-2 text-xs font-semibold text-cream-50">
            Approve
          </button>
        )}
        <button name="op" value="delete" className="rounded-full px-4 py-2 text-xs font-semibold text-chilli-600 hover:bg-chilli-600/5">
          Delete
        </button>
      </form>
    </li>
  );

  return (
    <>
      <AdminHeader title="Reviews" subtitle={`${pending.length} waiting for approval · ${live.length} live`} />
      <Card>
        <h2 className="font-display text-2xl text-forest-900">Waiting for approval</h2>
        {pending.length ? (
          <ul className="mt-2">
            {pending.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-500">All caught up.</p>
        )}
      </Card>
      <Card className="mt-6">
        <h2 className="font-display text-2xl text-forest-900">Live on the site</h2>
        <ul className="mt-2">
          {live.map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </ul>
      </Card>
    </>
  );
}
