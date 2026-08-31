"use client";

import { FieldDescription, FieldLabel, useField } from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";

/**
 * Why a held Match is held, read out in full rather than as pill chips.
 *
 * The default hasMany-text UI is built for short tags and truncates anything
 * longer — exactly wrong for a sentence an editor is meant to read and act on
 * (#45). This is the same field underneath (`heldReasons`, written once by
 * lib/saving when the importer holds a match); only the display changes.
 */
export function HeldReasonsField({ field, path }: TextFieldClientProps) {
  const { value } = useField<string[]>({ path });
  const reasons = Array.isArray(value) ? value : [];

  if (reasons.length === 0) return null;

  return (
    <div className="field-type">
      <FieldLabel label={field.label} path={path} />
      <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
        {reasons.map((reason, i) => (
          <li key={i} style={{ marginTop: i === 0 ? 0 : 6 }}>
            {reason}
          </li>
        ))}
      </ul>
      <FieldDescription description={field.admin?.description} path={path} />
    </div>
  );
}

export default HeldReasonsField;
