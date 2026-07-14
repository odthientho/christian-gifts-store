"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Package } from "lucide-react";

import { createCheckoutSessionAction, type CheckoutFormInput } from "@/server/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CheckoutLabels = {
  emailLabel: string;
  nameLabel: string;
  phoneLabel: string;
  addressLine1Label: string;
  addressLine2Label: string;
  cityLabel: string;
  stateLabel: string;
  postalCodeLabel: string;
  countryLabel: string;
  checkout: string;
  redirecting: string;
  placeOrder: string;
  placingOrder: string;
  securePayment: string;
  manualPaymentNotice: string;
};

const emptyForm: Omit<CheckoutFormInput, "email"> = {
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export function CheckoutForm({
  defaultEmail,
  paymentsEnabled,
  labels,
}: {
  defaultEmail?: string;
  paymentsEnabled: boolean;
  labels: CheckoutLabels;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [form, setForm] = useState(emptyForm);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const complete =
    email &&
    form.name &&
    form.phone &&
    form.addressLine1 &&
    form.city &&
    form.state &&
    form.postalCode &&
    form.country;

  function checkout() {
    startTransition(async () => {
      const result = await createCheckoutSessionAction({
        email,
        ...form,
        addressLine2: form.addressLine2 || undefined,
      });
      if (result.ok) {
        window.location.href = result.url;
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3.5">
      <Field
        id="email"
        label={labels.emailLabel}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={setEmail}
      />
      <Field
        id="name"
        label={labels.nameLabel}
        autoComplete="name"
        value={form.name}
        onChange={(v) => set("name", v)}
      />
      <Field
        id="phone"
        label={labels.phoneLabel}
        type="tel"
        autoComplete="tel"
        value={form.phone}
        onChange={(v) => set("phone", v)}
      />
      <Field
        id="addressLine1"
        label={labels.addressLine1Label}
        autoComplete="address-line1"
        value={form.addressLine1}
        onChange={(v) => set("addressLine1", v)}
      />
      <Field
        id="addressLine2"
        label={labels.addressLine2Label}
        autoComplete="address-line2"
        value={form.addressLine2 ?? ""}
        onChange={(v) => set("addressLine2", v)}
        optional
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          id="city"
          label={labels.cityLabel}
          autoComplete="address-level2"
          value={form.city}
          onChange={(v) => set("city", v)}
        />
        <Field
          id="state"
          label={labels.stateLabel}
          autoComplete="address-level1"
          value={form.state}
          onChange={(v) => set("state", v)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          id="postalCode"
          label={labels.postalCodeLabel}
          autoComplete="postal-code"
          value={form.postalCode}
          onChange={(v) => set("postalCode", v)}
        />
        <Field
          id="country"
          label={labels.countryLabel}
          autoComplete="country-name"
          value={form.country}
          onChange={(v) => set("country", v)}
        />
      </div>

      <Button
        className="h-11 w-full gap-2 text-sm"
        disabled={pending || !complete}
        onClick={checkout}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {paymentsEnabled ? labels.redirecting : labels.placingOrder}
          </>
        ) : paymentsEnabled ? (
          <>
            <Lock className="size-3.5" strokeWidth={2} />
            {labels.checkout}
          </>
        ) : (
          <>
            <Package className="size-3.5" strokeWidth={2} />
            {labels.placeOrder}
          </>
        )}
      </Button>

      {paymentsEnabled ? (
        <p className="text-center text-xs text-muted-foreground">
          {labels.securePayment}
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          {labels.manualPaymentNotice}
        </p>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  optional,
  ...props
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
} & Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
        {optional && <span className="ml-1 text-muted-foreground/70">(optional)</span>}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10"
        {...props}
      />
    </div>
  );
}
