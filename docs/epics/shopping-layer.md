# Epic: Shopping Layer

## Overview

The Shopping Layer enables the core purchase transaction flow, from adding products to cart through completing checkout as either a guest or authenticated user. This epic delivers the shopping cart, guest checkout, authenticated checkout, and multi-language support to create a frictionless purchase experience.

## Epic Description

This epic delivers the essential shopping and checkout capabilities that convert browsing customers into paying customers. It provides a robust shopping cart with real-time inventory validation, cross-device cart recovery, flexible checkout options (guest and authenticated), and Hindi/English language support. These features minimize friction for first-time buyers while streamlining repeat purchases for authenticated users.

## Features in this Epic

1. **Shopping Cart Management** — Allow users to add, update, and remove items from cart with real-time inventory validation; persist cart across sessions for authenticated users and via email recovery for unauthenticated users
2. **Guest Checkout** — Enable unauthenticated users to complete purchase without account creation; offer optional registration post-purchase
3. **Authenticated Checkout** — Enable registered users to checkout using saved addresses and payment methods
4. **Multi-Language Support (Hindi + English)** — Display product catalog, checkout flow, and customer communications in Hindi and English

## Epic-level Success Criteria

### Shopping Cart
- Users can add products to cart from search results and detail pages
- Cart displays accurate product information (name, price, quantity, images)
- Real-time inventory validation shows stock status for cart items
- Cart persists across sessions for authenticated users
- Unauthenticated users can recover cart via email link (cross-device)
- Cart calculates subtotal, taxes, and shipping costs accurately
- Users can update quantities or remove items seamlessly

### Checkout Experience
- Unauthenticated users can complete purchases without creating accounts
- Guest checkout completes within 3-5 screens (cart → shipping → payment → confirmation)
- Authenticated users see saved addresses and can select or add new ones
- Optional post-purchase registration offered to guest users
- Checkout flow validates shipping addresses and required fields
- Clear error messaging for validation failures

### Multi-Language Support
- Users can switch between Hindi and English throughout the experience
- Product names, descriptions, and categories display in selected language
- Checkout flow labels and buttons localized
- Email communications sent in user's selected language
- Language preference persists across sessions for authenticated users

### Performance & Reliability
- Cart operations (add/update/remove) complete within 300ms (P95)
- Checkout flow loads within 2 seconds on 4G networks
- Language switching updates UI without full page reload
- Cart state syncs across devices for authenticated users within 5 seconds

## Integration Points with Other Epics

### Upstream Dependencies
- **Foundation Layer** — Product Catalog provides product information (SKU, price, stock status, images); User Profile Management provides saved addresses for authenticated checkout
- **Discovery Layer** — Product Search and Detail Pages drive "Add to Cart" actions

### Downstream Dependencies (Features that depend on Shopping Layer)
- **Checkout** — Payment Gateway Integration processes payment for cart contents; Order Creation & Confirmation creates order record from cart
- **Post-Purchase Layer** — Order History displays completed orders from checkout
- **Support Layer** — Transactional Email Notifications send cart recovery and checkout confirmation emails

### Data Flows
- **From Foundation Layer:** Product data (SKU, name, price, images), user profile (addresses, preferences)
- **From Discovery Layer:** Product selections added to cart
- **To Checkout:** Cart contents (line items, subtotal), shipping address, user identity
- **From Platform Layer:** Feature flags control checkout flow variations (A/B tests)

## Cross-cutting Concerns

### Cart State Management
- Cart must handle concurrent updates (multiple tabs, race conditions)
- Cart persistence uses Firestore for authenticated users, session storage for guests
- Cross-device cart recovery for guests requires email link with secure token
- Inventory validation runs at add-to-cart AND at checkout (inventory not reserved until payment)

### Security
- Cart recovery links must use time-limited, signed tokens
- Cart contents validated server-side to prevent price manipulation
- Checkout forms protected against CSRF attacks
- Shipping addresses validated for required fields and format

### Performance
- Cart state cached in client to minimize Firestore reads
- Inventory checks batched for multi-item carts
- Checkout flow pre-fetches shipping address options for authenticated users
- Language switching uses client-side rendering (no server round-trip)

### Data Consistency
- Cart prices reflect current product pricing (not cached)
- Stock status validated in real-time before checkout
- Cart subtotal recalculated when quantities change
- Shipping costs calculated based on current address and cart weight

### Observability
- Track cart abandonment rate and abandonment stage (cart, shipping, payment)
- Monitor cart operation latency and error rates
- Measure guest vs. authenticated checkout conversion rates
- Track language preference distribution (Hindi vs. English)

### Internationalization
- All checkout labels, buttons, and error messages localized
- Product names and descriptions display in selected language
- Currency formatting uses Indian conventions (₹)
- Date and number formatting follows locale standards

### Accessibility
- Cart operations keyboard accessible (update quantity, remove items)
- Checkout flow screen reader compatible
- Error messages announced to screen readers
- Language switcher accessible and clearly labeled

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|----------|
| Cart abandonment rate > 70% | Lost revenue, poor conversion | Email cart recovery for guests; saved addresses for authenticated users; clear shipping costs early |
| Inventory overselling | Customer frustration, cancellations | Clear messaging that inventory reserved at payment; real-time validation at checkout |
| Cross-device cart sync failures | Poor UX for authenticated users | Fallback to session cart; email recovery link; Firestore retry logic |
| Guest checkout conversion failure | Lost first-time buyers | Minimal fields; clear error messages; optional post-purchase registration |
| Language switching breaks checkout state | Lost progress, frustration | Client-side language switching; maintain checkout state in Firestore |

## Success Metrics

### Cart Engagement
- Add-to-cart rate from product detail pages > 10%
- Cart abandonment rate < 70%
- Average cart value ≥ ₹2,500 (meets AOV target)
- Cross-device cart recovery success rate > 20%

### Checkout Conversion
- Guest checkout completion rate > 60%
- Authenticated checkout completion rate > 75%
- Post-purchase registration acceptance rate > 25%
- Checkout abandonment at shipping stage < 20%
- Checkout abandonment at payment stage < 30%

### Multi-Language Adoption
- Hindi language preference among users > 30%
- Language switching during session < 10% (indicates good initial language detection)

### Technical Performance
- Cart operations (add/update/remove) < 300ms (P95)
- Checkout page load time < 2 seconds (P95)
- Language switching < 500ms (P95)
- Cart sync across devices < 5 seconds

## Definition of Done

This epic is complete when:

1. ✅ All four features are fully specified with acceptance criteria
2. ✅ Users can add products to cart and persist across sessions
3. ✅ Guest users can complete checkout without registration
4. ✅ Authenticated users can checkout with saved addresses
5. ✅ Users can switch between Hindi and English throughout the experience
6. ✅ Integration tests validate cart operations and checkout flows
7. ✅ Performance benchmarks meet P95 latency targets
8. ✅ Cart abandonment rate measured and below 70% threshold
9. ✅ Email cart recovery tested for guest users
10. ✅ Language switching preserves checkout state
