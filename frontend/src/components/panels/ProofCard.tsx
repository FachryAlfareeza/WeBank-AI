import type { ZkpProof } from "@/types";

/** Session 2 — real ZKP proof gate (HMAC-SHA256). */
export function ProofCard({ proof, verified }: { proof: ZkpProof; verified: boolean }) {
  return (
    <div className={`card card--proof ${verified ? "card--ok" : "card--warn"}`}>
      <div className="card__title">
        ZKP eligibility {verified ? "verified ✓" : "not satisfied ✗"}
      </div>
      <p className="card__text">
        Proven DSCR ≥ {proof.dscr_threshold_proven} and amount within ceiling, without exposing raw revenue.
      </p>
      <div className="card__grid">
        <div>
          <span className="card__label">DSCR satisfied</span>
          <span className="card__value">{proof.is_dscr_satisfied ? "yes" : "no"}</span>
        </div>
        <div>
          <span className="card__label">Ceiling satisfied</span>
          <span className="card__value">{proof.is_ceiling_satisfied ? "yes" : "no"}</span>
        </div>
      </div>
      <div className="card__sources">
        {proof.merchant_pseudonym} · hash {proof.commitment_hash.slice(0, 16)}…
      </div>
    </div>
  );
}
