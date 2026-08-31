"use client";

// The Enquiry form itself.
//
// A client component for one reason: the timing check in
// apps/cms/src/lib/spam.ts needs the moment the form actually rendered in a
// visitor's browser, not the moment the page was built — the page is
// prerendered (docs/deploy.md, "every page is prerendered"), so a timestamp
// baked in at build time would be hours or days old and the check would never
// catch anything. `Date.now()` at mount is the one piece of state this needs;
// everything else works the same submitted with or without JavaScript, via
// the server action on the form's own `action`.

import { useActionState, useEffect, useRef } from "react";

import { submitEnquiry } from "./actions";
import { initialEnquiryState } from "./enquiry-state";
import styles from "./EnquiryForm.module.css";

export function EnquiryForm() {
  const [state, formAction, isPending] = useActionState(
    submitEnquiry,
    initialEnquiryState,
  );
  // Set on the input directly, in an effect, rather than through React state:
  // the page is prerendered (docs/deploy.md), and a client component's first
  // render still runs once during that prerender — `Date.now()` read there
  // would bake in the build's own moment, not a visitor's, and a `setState`
  // call in an effect only papers over the same problem with an extra
  // render. An effect only ever runs in the browser, after hydration, which
  // is the moment the timing check actually needs.
  const renderedAtRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renderedAtRef.current) renderedAtRef.current.value = String(Date.now());
  }, []);

  if (state.status === "success") {
    return (
      <p className={styles.success} role="status">
        Thank you — your enquiry has been sent, and the committee will be in
        touch.
      </p>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="renderedAt" ref={renderedAtRef} defaultValue="" />

      {/* The honeypot. Off-screen rather than display:none, so a script that
          only checks visibility::none still finds a field it takes to be real;
          aria-hidden and tabIndex=-1 keep it out of everything a person,
          sighted or not, could actually reach. See lib/spam. */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field blank</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <TextField
        id="name"
        name="name"
        label="Name"
        type="text"
        autoComplete="name"
        defaultValue={state.values.name}
        error={state.errors.name}
      />
      <TextField
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.values.email}
        error={state.errors.email}
      />
      <TextField
        id="message"
        name="message"
        label="Message"
        multiline
        defaultValue={state.values.message}
        error={state.errors.message}
      />

      {state.formError && (
        <p className={styles.formError} role="alert">
          {state.formError}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? "Sending…" : "Send enquiry"}
      </button>

      <noscript>
        <p className={styles.noscript}>
          This form checks for spam using JavaScript before sending — please
          enable it, or write to the Secretary directly.
        </p>
      </noscript>
    </form>
  );
}

function TextField({
  id,
  name,
  label,
  type = "text",
  multiline = false,
  autoComplete,
  defaultValue,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  multiline?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={5}
          required
          defaultValue={defaultValue}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
        />
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
