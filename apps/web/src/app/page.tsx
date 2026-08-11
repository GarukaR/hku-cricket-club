// PROTOTYPE MOUNT — throwaway.
//
// Three variants of the d2 "Since 1913" homepage, each integrating the d1
// broadcast scoreline a structurally different way, switchable via ?variant=.
// The foundation status page that used to live here is in git history
// (commit e4bf730) and comes back when the prototype is folded in.

import "./prototype-homepage/proto.css";
import { PrototypeSwitcher } from "./prototype-homepage/PrototypeSwitcher";
import { VariantA, VariantB, VariantC, variantNames } from "./prototype-homepage/variants";

const VARIANTS = ["A", "B", "C"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  const key = variant && VARIANTS.includes(variant) ? variant : "A";

  return (
    <div className="proto">
      {key === "A" && <VariantA />}
      {key === "B" && <VariantB />}
      {key === "C" && <VariantC />}
      {process.env.NODE_ENV !== "production" && (
        <PrototypeSwitcher
          variants={VARIANTS}
          current={key}
          names={variantNames}
        />
      )}
    </div>
  );
}
