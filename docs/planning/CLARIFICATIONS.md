# Project Clarifications — itsme.fashion PRD

> Please review and select options or provide input for each question before proceeding to roadmap definition.

---

## Q1: Third-Party Verification of Ethical Certifications

**Current State:** The PRD mentions "ethical markers" (cruelty-free, paraben-free, vegan) but does not specify who verifies that claims are legitimate.

**Decision Required:**

- [x] **Option A:** itsme.fashion accepts brand self-certification with no independent verification (faster launch, higher trust risk)
- [ ] **Option B:** itsme.fashion requires third-party certifications (Leaping Bunny, PETA, Vegan Society) only (slower sourcing, highest trust)
- [ ] **Option C:** itsme.fashion accepts both self-certification AND third-party certifications, but visually distinguishes them for users (balanced, complex)
- [ ] **Other:** [Please specify]

**Why This Matters:**
If a brand's "cruelty-free" claim is false and goes viral as negative press, liability and brand damage are material. This decision directly affects product sourcing workflow, supplier contracts, and legal risk posture.

---

## Q2: User Data Retention and GDPR Deletion Rights

**Current State:** The PRD mentions GDPR compliance and user data deletion on request, but does not specify what happens to order history, reviews, or refund records if a user requests deletion.

**Decision Required:**

- [ ] **Option A:** Complete data deletion on user request—order history, reviews, and payment records are permanently anonymized (strict GDPR, audit risk)
- [x] **Option B:** User account and personal data deleted, but order history and payment records retained anonymously for compliance/refund purposes (balanced, legally safe)
- [ ] **Option C:** User account deleted, but order history remains tied to user ID for 7 years for refund/tax purposes; only then anonymized (compliant, operationally simpler)
- [ ] **Other:** [Please specify]

**Why This Matters:**
Retention policies affect database design, refund workflows, tax compliance, and legal defensibility. Incorrectly implemented deletion can lead to regulatory fines or ability to process refunds.

---

## Q3: Refund and Return Policy Authority

**Current State:** The PRD does not specify who owns refund/return policy (itsme.fashion vs. individual brands) or what happens if a brand and itsme.fashion disagree.

**Decision Required:**

- [ ] **Option A:** itsme.fashion enforces a single platform-wide refund policy (30 days, full refund) regardless of brand preferences (customer-friendly, brand friction)
- [ ] **Option B:** Each brand sets their own refund policy; itsme.fashion displays it prominently at checkout (brand autonomy, customer confusion)
- [x] **Option C:** itsme.fashion enforces a minimum guarantee (30 days, full refund) but allows brands to offer better terms (balanced)
- [ ] **Other:** [Please specify]

**Why This Matters:**
Refund policy directly affects customer trust, support workload, brand relationships, and revenue (refund rate impacts LTV). Ambiguity leads to customer disputes and inconsistent experiences.

---

## Q4: Inventory Ownership and Responsibility

**Current State:** The PRD mentions "manual catalog updates" and "no marketplace model," but does not specify whether itsme.fashion holds inventory or brands hold inventory.

**Decision Required:**

- [ ] **Option A:** itsme.fashion owns inventory (dropship model)—purchases from brands wholesale, stocks, and ships to customers (capital intensive, fulfillment ownership, better margins)
- [x] **Option B:** Brands own inventory—itsme.fashion is a catalog/checkout layer; brands fulfill directly to customers (capital light, fulfillment complexity, lower margins)
- [ ] **Option C:** Hybrid—itsme.fashion owns fast-moving SKUs, brands own slow-moving SKUs (operationally complex, requires tracking per product)
- [ ] **Other:** [Please specify]

**Why This Matters:**
Inventory ownership affects supply chain design, Shiprocket integration, working capital, fulfillment SLAs, and margin structure. This decision is nearly irreversible once suppliers are contracted.

---

## Q5: Payment Processing for Refunds

**Current State:** The PRD specifies Cashfree for payment acceptance but does not describe refund workflows—specifically, how long refunds take to appear in customer accounts.

**Decision Required:**

- [ ] **Option A:** Full refunds processed immediately upon return acceptance; customer sees credit within 1 business day (customer-friendly, requires Cashfree support)
- [x] **Option B:** Refunds processed within 5-7 business days per Cashfree standard timelines (standard, lower support overhead)
- [ ] **Option C:** Store credit instead of full refunds; customer receives instant usable credit; full refund only after 30 days (retention strategy, complex UX)
- [ ] **Other:** [Please specify]

**Why This Matters:**
Refund timelines affect customer satisfaction, support workload, and Cashfree fee structure. Setting incorrect expectations leads to support escalation and negative reviews.

---

## Q6: Search and Product Discovery Algorithm Ownership

**Current State:** The PRD mentions "search by ethical markers" and "product filtering" but does not specify whether itsme.fashion maintains an internal search index or relies on a third-party search service.

**Decision Required:**

- [x] **Option A:** Build internal search using Firestore queries + Algolia/Meilisearch (better relevance, faster, adds operational complexity and cost)
- [ ] **Option B:** Rely on Firestore collection queries only (simpler, slower for complex filters, limits UX)
- [ ] **Option C:** Use GraphQL filtering at API layer only (simplest, but doesn't scale to large datasets)
- [ ] **Other:** [Please specify]

**Why This Matters:**
Search experience directly affects conversion rate (KPI-001). Poor search = higher bounce rates = lower conversion. This decision affects API design, database schema, and operational costs.

---

## Q7: User Reviews Moderation and Verification

**Current State:** The PRD includes product reviews as a feature but does not specify whether itsme.fashion moderates reviews or verifies that reviewers actually purchased the product.

**Decision Required:**

- [ ] **Option A:** No moderation; all reviews published immediately; only verified purchasers can review (fastest, trust risk)
- [x] **Option B:** All reviews auto-published but flagged for manual moderation; verified purchase required (balanced)
- [ ] **Option C:** All reviews require manual approval before publishing; verified purchase required; brand can flag inappropriate reviews (slowest, highest trust)
- [ ] **Other:** [Please specify]

**Why This Matters:**
Fake or malicious reviews destroy brand credibility. This decision affects trust metrics, support workload, brand relationships, and legal liability for defamation.

---

## Q8: International Shipping and Currency Support

**Current State:** The PRD lists "multi-region, multi-currency expansion" as a Phase 3 goal but does not specify the launch region or whether international shipping is in-scope for MVP.

**Decision Required:**

- [ ] **Option A:** MVP is USA-only, single currency (USD); international shipping added in Phase 3 (simplest MVP, market limitation)
- [ ] **Option B:** MVP launches in USA but accepts international orders with carrier selection per region (complex, slower launch)
- [x] **Option C:** MVP is USA-only; international shipping explicitly out-of-scope until Phase 3 decision gate (simple, clear boundary)
- [ ] **Other:** [Please specify]

**Why This Matters:**
Shipping scope directly affects Shiprocket integration, address validation, taxes/duties, and operational complexity. Wrong decision = international orders shipped incorrectly = churn and refunds.

---

## Q9: Reporting and Analytics Data Ownership

**Current State:** The PRD specifies GA4 and OpenTelemetry for analytics but does not specify whether brands can access product-level sales or customer data.

**Decision Required:**

- [ ] **Option A:** itsme.fashion owns all data; brands receive summary dashboards only (aggregate revenue, not customer details) (privacy-strong, brand friction)
- [ ] **Option B:** Brands can access full product-level analytics including customer names and emails (brand-friendly, privacy risk, GDPR challenge)
- [x] **Option C:** Brands access product-level stats (units sold, revenue, reviews) but NOT customer identities or emails (balanced)
- [ ] **Other:** [Please specify]

**Why This Matters:**
Data ownership affects brand contracts, GDPR compliance, competitive dynamics, and system design. Brands may require access for inventory planning; itsme.fashion may need to restrict for competitive reasons.

---

## Q10: Feature Flag Rollout for Payment Gateway Failure

**Current State:** The PRD mentions feature flags and payment processing but does not specify what happens if Cashfree experiences a major outage.

**Decision Required:**

- [ ] **Option A:** If Cashfree is down, checkout is disabled entirely; customers see "temporarily unavailable" message (simple, revenue loss)
- [x] **Option B:** If Cashfree is down, offer alternative payment methods or manual processing option (complex, covers revenue but adds operational overhead)
- [ ] **Option C:** If Cashfree is down, queue orders for manual payment confirmation once service restores; hold inventory (complex, customer friction)
- [ ] **Other:** [Please specify]

**Why This Matters:**
Payment failure workflows directly affect revenue, customer trust, and support workload. Ambiguous handling leads to lost orders or customer disputes during critical incidents.

---

## Next Steps

1. **Review** all 10 questions above
2. **Select options** or provide alternative answers for each
3. **Document decisions** in this file (replace checkboxes with selected option)
4. **Notify** when all clarifications are resolved

**No downstream work proceeds until all clarifications are complete and documented.**

---

**Status:** ✅ Clarifications Complete & PRD Updated  
**Ambiguity Count:** 0 (all decisions documented in PRD)  
**Next Step:** Re-run ambiguity detection to validate decision completeness