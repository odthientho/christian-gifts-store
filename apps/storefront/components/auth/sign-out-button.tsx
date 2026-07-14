import { redirect } from "next/navigation";

import { clearSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await clearSession();
        redirect("/");
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        {label}
      </Button>
    </form>
  );
}
