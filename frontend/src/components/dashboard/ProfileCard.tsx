import type { Merchant } from "@/types/dashboard";
import { maskAccount } from "@/services/merchantStore";

/** Business profile: identity + masked payout account. Clean, formal layout. */
export function ProfileCard({ merchant }: { merchant: Merchant }) {
  return (
    <section className="dash-card">
      <h2 className="dash-card__title">Business profile</h2>
      <dl className="dash-card__defs">
        <div className="dash-def">
          <dt className="dash-def__key">Merchant</dt>
          <dd className="dash-def__val">{merchant.name}</dd>
        </div>
        <div className="dash-def">
          <dt className="dash-def__key">Business type</dt>
          <dd className="dash-def__val">{merchant.businessType}</dd>
        </div>
        <div className="dash-def">
          <dt className="dash-def__key">Merchant ID</dt>
          <dd className="dash-def__val dash-def__val--mono">{merchant.id}</dd>
        </div>
        <div className="dash-def">
          <dt className="dash-def__key">Payout account</dt>
          <dd className="dash-def__val dash-def__val--mono">
            {maskAccount(merchant.destinationAccount)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
