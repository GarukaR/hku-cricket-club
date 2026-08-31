import { APIError, type CollectionBeforeValidateHook, type CollectionConfig } from "payload";

import { spamReason } from "@/lib/spam";

import { submittableByAnyone } from "./access";

/**
 * Turns away what the public form's own honeypot and clock already caught.
 *
 * Only for `create`, and only for a stranger: an editor typing in a phone
 * enquiry from the admin has no honeypot to fill and no page-render clock
 * running, and is not who this defends against. `req.user` is exactly the
 * distinction `submittableByAnyone`'s access rule already draws.
 *
 * The rule itself is in lib/spam, tested without Payload anywhere near it —
 * this only reads what it needs off the request and turns a reason into a
 * rejection.
 */
const rejectSpam: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation !== "create" || req.user || !data) return data;

  const honeypot = typeof data.website === "string" ? data.website : "";
  const renderedAt =
    typeof data.renderedAt === "number" ? data.renderedAt : undefined;

  const reason = spamReason({
    honeypot,
    elapsedMs: renderedAt === undefined ? undefined : Date.now() - renderedAt,
  });

  if (reason) {
    // 400, not the default 500: `lib/cms.ts`'s `create` on the site tells a
    // rejection (the visitor's own submission) apart from an unreachable CMS
    // (the club's problem) by status code alone, and needs a 4xx to do it.
    // `isPublic: false` keeps the actual reason — which is logged here, not
    // discarded — out of the response, so a bot is turned away without being
    // told what tipped it off.
    req.payload.logger.info(`Enquiry rejected: ${reason}.`);
    throw new APIError("Enquiry rejected.", 400, undefined, false);
  }

  return data;
};

/**
 * A message from someone who wants to play, sent through the site
 * (CONTEXT.md — Enquiry).
 *
 * Its own collection rather than a Player field, because an Enquiry is
 * explicitly *not* a Player (CONTEXT.md): most never become one, and the two
 * have almost nothing in common — no Registrations, no Appearances, nothing
 * derived. `status` is the whole workflow, because the committee's channel
 * into this is the admin list, not an inbox: nobody here has agreed to run
 * transactional email for a hundred-and-thirteen-year-old club's contact
 * form, so the list sorted newest-first with unactioned enquiries flagged is
 * the notification (issue #16 — "the queue is visible enough not to need
 * it"), the same call `lib/standing.ts` already made for outstanding
 * results.
 */
export const Enquiries = {
  slug: "enquiries",
  labels: { singular: "Enquiry", plural: "Enquiries" },
  defaultSort: "-createdAt",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "status", "createdAt"],
    description:
      "Messages from people who want to play, sent through the site's own form. An Enquiry is not a Player — most never become one.",
    group: "Selection",
  },
  access: submittableByAnyone,
  hooks: { beforeValidate: [rejectSpam] },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "message",
      type: "textarea",
      required: true,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        { value: "new", label: "New" },
        { value: "actioned", label: "Actioned" },
      ],
      admin: {
        position: "sidebar",
        description:
          "New until somebody on the committee has followed it up. There is no other notification, so this is the whole queue.",
      },
    },
    {
      // The honeypot. Hidden from a person by the form's own CSS, so a filled
      // value means whatever submitted this did not see the page as a person
      // does. See lib/spam.
      name: "website",
      type: "text",
      admin: { hidden: true },
    },
    {
      // When the form rendered, in epoch milliseconds, set by the browser and
      // compared against the moment this arrives. See lib/spam.
      name: "renderedAt",
      type: "number",
      admin: { hidden: true },
    },
  ],
} satisfies CollectionConfig;
