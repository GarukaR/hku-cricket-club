// Validating an Enquiry before it ever reaches the CMS.
//
// Checked here as well as on the server that stores it, because a rejection
// with nothing but "invalid" makes a visitor guess what to fix, and a form
// that round-trips to the CMS before saying so is a form that punishes
// somebody for a typo in their own email address (issue #16 — "Validation
// errors name both the problem and the fix").

export type EnquiryInput = {
  name: string;
  email: string;
  message: string;
};

export type EnquiryErrors = Partial<Record<keyof EnquiryInput, string>>;

/** Good enough to catch a typo, not an attempt to fully validate an email
 *  address — that requires sending one, which is what the committee's reply
 *  will do. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * What is wrong with this Enquiry, and how to fix it — empty if nothing is.
 *
 * Each message names the field's problem and the fix together, in one
 * sentence, so an error can stand alone next to the field it belongs to
 * without a visitor having to relate it back to a summary above the form.
 */
export function validateEnquiry(input: EnquiryInput): EnquiryErrors {
  const errors: EnquiryErrors = {};

  const name = input.name.trim();
  if (!name) {
    errors.name = "Enter your name, so the committee knows who is asking.";
  }

  const email = input.email.trim();
  if (!email) {
    errors.email = "Enter your email address, so the committee can reply.";
  } else if (!EMAIL_SHAPE.test(email)) {
    errors.email =
      "That email address is missing something — check it reads like name@example.com.";
  }

  const message = input.message.trim();
  if (!message) {
    errors.message =
      "Write a line or two about yourself, so the committee has something to go on.";
  }

  return errors;
}
