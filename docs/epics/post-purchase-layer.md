# Epic: Post-Purchase Layer

## Overview

The Post-Purchase Layer enables order management, returns processing, customer retention, and data privacy compliance after purchase completion. This epic delivers order history, shipment tracking, returns workflow, wishlist functionality, and DPDP-compliant data rights to build customer loyalty and trust.

## Epic Description

This epic delivers the post-purchase capabilities essential for customer retention and satisfaction. It provides transparent order tracking with real-time shipment updates, self-service returns within a 7-day window, persistent wishlists with social sharing, and DPDP-compliant data export and deletion workflows. These features build trust, reduce support burden, and create touchpoints for repeat engagement.

## Features in this Epic

1. **Order History & Status Tracking** — Display orders visible for 2 years from purchase; show order status (Confirmed, Processing, Shipped, Delivered, Cancelled) and shipment details
2. **Shipment Tracking Integration** — Integrate with Shiprocket for real-time tracking updates; cache tracking data on external failure; send status update emails to customers
3. **Return Request Initiation** — Allow customers to initiate return requests for orders within 7 days of delivery via order history page; self-service request submission
4. **Return Processing & Refunds** — Support team manually reviews return requests, verifies condition and eligibility, and issues refunds to original payment method or store credit
5. **Wishlist & Sharing** — Allow authenticated users to save products to personal wishlist; generate shareable link that allows other users to view items (read-only)
6. **Data Subject Rights (Export & Deletion)** — Support team processes user requests to export personal data or delete account within 30 days; ensures DPDP compliance

## Epic-level Success Criteria

### Order Transparency
- Authenticated users can view all orders from past 2 years
- Order status updates in real-time (via Shiprocket webhooks)
- Order details include product information, pricing, shipping address, and tracking number
- Users can track shipments directly from order history page
- Email notifications sent for key status changes (shipped, delivered, returned)

### Returns Experience
- Users can initiate returns for eligible orders (within 7 days of delivery)
- Self-service return request form captures reason, images (optional), and preferred refund method
- Support team reviews and approves/rejects return requests within 2 business days
- Refunds processed to original payment method within 7-10 business days
- Return status tracked in order history

### Customer Loyalty
- Authenticated users can save unlimited products to wishlist
- Wishlist displays current price and stock status for each product
- Users can generate shareable wishlist link (view-only for recipients)
- Wishlist persists across sessions and devices
- Users can add wishlist items to cart directly

### Data Privacy & Compliance
- Users can request data export (receives JSON/CSV file with all personal data)
- Users can request account deletion (processed within 30-day DPDP SLA)
- Data export includes profile, order history, wishlist, addresses, and communication preferences
- Account deletion anonymizes order history (retains for fraud prevention) and deletes profile, addresses, wishlist

### Performance & Reliability
- Order history loads within 2 seconds (P95)
- Shipment tracking updates cached for 24 hours (reduces Shiprocket API calls)
- Return request submission completes within 1 second
- Wishlist operations (add/remove) complete within 500ms (P95)

## Integration Points with Other Epics

### Upstream Dependencies
- **Foundation Layer** — User Registration & Authentication provides user identity; User Profile Management stores user data for export/deletion
- **Shopping Layer** — Authenticated Checkout creates orders that appear in order history
- **Checkout** — Order Creation & Confirmation generates order records; Payment Gateway Integration handles refunds

### Downstream Dependencies
- **Support Layer** — Customer Support handles return disputes and data request processing; Transactional Email Notifications send order status updates
- **Discovery Layer** — Product Detail Pages are linked from wishlist items

### Data Flows
- **From Checkout:** Order records (line items, totals, addresses, payment method)
- **From Shiprocket:** Shipment tracking events (shipped, in-transit, delivered)
- **To Payment Gateway:** Refund requests for approved returns
- **To Support:** Return requests requiring manual review
- **From Foundation Layer:** User profile data for export; product data for wishlist display

## Cross-cutting Concerns

### Order Data Retention
- Orders visible for 2 years from purchase date
- Older orders archived (unavailable in UI but retained for compliance)
- Anonymized orders retained for 7 years (fraud prevention, tax compliance)
- Order history paginated (20 orders per page)

### Shipment Tracking Reliability
- Shiprocket webhook failures handled via retry logic (exponential backoff)
- Tracking data cached for 24 hours to reduce API calls
- Fallback to email notifications if tracking updates fail
- Manual tracking number entry for support escalation

### Returns Fraud Prevention
- Return window enforced (7 days from delivery date)
- Support team reviews return requests (photos, reason, order history)
- Serial returners flagged for additional review
- Refund method restricted to original payment method (reduces fraud)

### Security
- Order history requires authentication and user ID match
- Wishlist shareable links use non-guessable tokens
- Data export files secured with password protection
- Account deletion requires email confirmation to prevent unauthorized deletion

### Performance
- Order history queries use Firestore composite indexes (user ID + order date)
- Wishlist items denormalized to include current price/stock (reduces joins)
- Shipment tracking updates propagated via Firestore real-time listeners
- Data export generated asynchronously (background job, email when ready)

### Observability
- Track return request rate and approval rate
- Monitor Shiprocket API failures and retry success rate
- Measure wishlist engagement (add rate, share rate, conversion to purchase)
- Alert on data export/deletion SLA approaching 30-day limit

### Internationalization
- Order history displays dates in user's locale format
- Return request forms and emails localized (Hindi + English)
- Wishlist product names displayed in user's selected language
- Data export file includes localized field labels

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|----------|
| Shiprocket API outage | No tracking updates, customer frustration | Cached tracking data; email fallback; support escalation path |
| High return rate (>5%) | Increased costs, refund processing burden | 7-day window limits abuse; manual review prevents fraud; product quality feedback loop |
| Data export/deletion SLA breach | DPDP compliance violation, legal exposure | Automated SLA alerts; queue monitoring; manual escalation process |
| Wishlist link abuse (scraping, spam) | Privacy concerns, performance degradation | Rate limiting on wishlist views; non-guessable tokens; link expiration (optional) |
| Refund processing delays | Customer dissatisfaction, payment gateway issues | Clear refund timing communication; Cashfree refund API monitoring; manual fallback |

## Success Metrics

### Order Transparency
- Order history page views per authenticated user > 3 per year
- Shipment tracking click-through rate > 50% of orders
- Email notification open rate > 25%

### Returns Management
- Return request rate < 5% of orders
- Return approval rate 70-80% (indicates balanced policy)
- Return request to refund processing time < 7 days (average)
- Self-service return initiation rate > 90% (vs. email/phone)

### Customer Loyalty
- Wishlist adoption rate > 20% of authenticated users
- Wishlist share rate > 5% of wishlist users
- Wishlist-to-purchase conversion > 15%
- Repeat purchase rate > 40% within 6 months

### Data Privacy Compliance
- 100% of data export requests completed within 30-day SLA
- 100% of account deletion requests completed within 30-day SLA
- Zero DPDP compliance violations reported

### Technical Performance
- Order history load time < 2 seconds (P95)
- Shipment tracking update latency < 10 seconds (webhook to UI)
- Wishlist operations < 500ms (P95)
- Data export generation < 24 hours

## Definition of Done

This epic is complete when:

1. ✅ All six features are fully specified with acceptance criteria
2. ✅ Users can view order history for past 2 years
3. ✅ Real-time shipment tracking integrated with Shiprocket
4. ✅ Self-service return request workflow operational
5. ✅ Support team can review and process returns
6. ✅ Authenticated users can create and share wishlists
7. ✅ Data export and deletion workflows meet DPDP compliance
8. ✅ Integration tests validate order history, tracking, returns, wishlist, and data rights
9. ✅ Performance benchmarks meet P95 latency targets
10. ✅ Return rate measured and below 5% threshold
11. ✅ Email notifications sent for order status changes
12. ✅ Refund processing tested end-to-end with Cashfree
