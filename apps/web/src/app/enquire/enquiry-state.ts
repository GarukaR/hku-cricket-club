// The form's state shape, and its starting value.
//
// Not in actions.ts: a `"use server"` file may only export async functions —
// anything else crosses the client/server boundary as a broken reference
// rather than the value it looks like, and `initialEnquiryState` needs to
// reach the client component as the plain object it is.

import type { EnquiryErrors, EnquiryInput } from "@/lib/enquiry";

export type EnquiryFormState = {
  status: "idle" | "success" | "error";
  values: Partial<EnquiryInput>;
  errors: EnquiryErrors;
  formError?: string;
};

export const initialEnquiryState: EnquiryFormState = {
  status: "idle",
  values: {},
  errors: {},
};
