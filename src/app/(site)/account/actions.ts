"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, requireUser } from "@/lib/auth";
import { INDIAN_STATES, isValidPincode } from "@/lib/commerce/shipping";
import { store } from "@/lib/data";

export interface FormState {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

/** Only allow same-site relative redirects. */
function safeNext(raw: FormDataEntryValue | null, fallback = "/account") {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : fallback;
}

const fieldErrors = (issues: z.core.$ZodIssue[]) => Object.fromEntries(issues.map((i) => [String(i.path[0]), i.message]));

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().email("Enter a valid email."), password: z.string().min(1, "Enter your password.") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const res = await auth.signIn(parsed.data.email, parsed.data.password);
  if (!res.ok) return { error: res.error };
  redirect(safeNext(formData.get("next"), res.user.role === "admin" ? "/admin" : "/account"));
}

export async function signUpAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Tell us your name.").max(80),
      email: z.string().trim().toLowerCase().email("Enter a valid email."),
      phone: z
        .string()
        .trim()
        .transform((v) => v.replace(/[\s-]/g, ""))
        .refine((v) => !v || /^(\+?91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number."),
      password: z.string().min(8, "Use at least 8 characters.").max(72),
    })
    .safeParse({ name: formData.get("name"), email: formData.get("email"), phone: formData.get("phone") ?? "", password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const res = await auth.signUp({ ...parsed.data, phone: parsed.data.phone || null });
  if (!res.ok) return { error: res.error };
  if (res.needsConfirmation) return { ok: true, message: "Almost there — check your inbox to confirm your email, then sign in." };
  redirect(safeNext(formData.get("next")));
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { fieldErrors: { email: "Enter a valid email." } };
  const res = await auth.requestPasswordReset(email.data);
  return res.ok ? { ok: true, message: res.message } : { error: res.message };
}

export async function signOutAction() {
  await auth.signOut();
  redirect("/");
}

export async function updateProfileAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Tell us your name.").max(80),
      phone: z
        .string()
        .trim()
        .transform((v) => v.replace(/[\s-]/g, ""))
        .refine((v) => !v || /^(\+?91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number."),
    })
    .safeParse({ name: formData.get("name"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  await auth.updateProfile(user.id, { name: parsed.data.name, phone: parsed.data.phone || null });
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile saved." };
}

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().max(30).default("Home"),
  fullName: z.string().trim().min(2, "Enter the recipient's name.").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(\+?91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number."),
  line1: z.string().trim().min(4, "Enter house / street.").max(120),
  line2: z.string().trim().max(120).optional(),
  landmark: z.string().trim().max(80).optional(),
  city: z.string().trim().min(2, "Enter your city.").max(60),
  state: z.enum(INDIAN_STATES),
  pincode: z.string().trim().refine(isValidPincode, "Enter a valid PIN code."),
  isDefault: z.boolean(),
});

export async function saveAddressAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/account/addresses");
  const parsed = addressSchema.safeParse({
    ...Object.fromEntries(["id", "label", "fullName", "phone", "line1", "line2", "landmark", "city", "state", "pincode"].map((k) => [k, formData.get(k) ?? undefined])),
    id: formData.get("id") || undefined,
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  await store.saveAddress(user.id, { ...parsed.data, line2: parsed.data.line2 || null, landmark: parsed.data.landmark || null });
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved." };
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser("/account/addresses");
  const id = formData.get("id");
  if (typeof id === "string") await store.deleteAddress(user.id, id);
  revalidatePath("/account/addresses");
}

export async function updatePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  await requireUser("/account/reset");
  const parsed = z.string().min(8, "Use at least 8 characters.").max(72).safeParse(formData.get("password"));
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues[0].message } };
  const res = await auth.updatePassword(parsed.data);
  return res.ok ? { ok: true, message: "Password updated — you're all set." } : { error: res.message };
}
