import { apiMe } from "@/lib/api";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  // Already signed in as admin → skip the form.
  const user = await apiMe();
  if (user?.role === "ADMIN") redirect("/products");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold tracking-tight">
          GIN<span className="text-primary"> Store</span>
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-widest text-neutral-500">
          Admin
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
