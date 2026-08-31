"use server";

// Handing an Enquiry to the CMS.
//
// The one server action on the site, because it is the one thing the site
// writes rather than reads (see lib/cms.ts). Validation runs here — never
// trusted from the client alone, since a request can always skip the browser
// — and the honeypot and timing fields ride along to `create`, where Payload's
// own `rejectSpam` hook (apps/cms/src/collections/Enquiries.ts) makes the real
// decision. This action only tells a genuine mistake (a bad email) apart from
// everything else, so it can say which is which.

import { create, CreateRejected } from "@/lib/cms";
import { type EnquiryInput, validateEnquiry } from "@/lib/enquiry";

import type { EnquiryFormState } from "./enquiry-state";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function submitEnquiry(
  _previous: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  const input: EnquiryInput = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    message: field(formData, "message"),
  };

  const errors = validateEnquiry(input);
  if (Object.keys(errors).length > 0) {
    return { status: "error", values: input, errors };
  }

  const renderedAtRaw = field(formData, "renderedAt");

  try {
    await create("enquiries", {
      name: input.name.trim(),
      email: input.email.trim(),
      message: input.message.trim(),
      website: field(formData, "website"),
      renderedAt: renderedAtRaw ? Number(renderedAtRaw) : undefined,
    });
  } catch (cause) {
    if (cause instanceof CreateRejected) {
      // A real visitor practically never lands here — the honeypot is
      // invisible and the timing floor is well under how long anyone takes to
      // write a message — so this is almost always a bot, and telling it
      // exactly why would only teach it what to fix next time.
      return {
        status: "error",
        values: input,
        errors: {},
        formError:
          "That submission could not be accepted. If you are not a robot, please try again.",
      };
    }

    return {
      status: "error",
      values: input,
      errors: {},
      formError:
        "The club's system could not be reached just now — this can happen if it has been asleep. Please try again in a minute, or write to the Secretary directly.",
    };
  }

  return { status: "success", values: {}, errors: {} };
}
