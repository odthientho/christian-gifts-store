import { cn } from "@/lib/utils";

// Status colours carry meaning, so they are not interchangeable:
// green = money settled, amber = waiting on the customer or Stripe,
// red = money went back out, neutral = closed without payment.
const STYLES: Record<string, string> = {
  PENDING: "bg-brass/20 text-brass-foreground",
  PAID: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  FULFILLED: "bg-primary/12 text-primary",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-destructive/12 text-destructive",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-wide",
        STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
