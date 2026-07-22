# MasManager Roadmap

Tracks the productivity build-out from the app review. Tier 1 is done. Tier 2
is operational polish. Tier 3 is what makes the app sellable to other section
leaders.

---

## Tier 1 — Connect the production/ordering chain (DONE)

The modeling was already in place; these turn it into the daily-driver answers.

- [x] **Production Needs engine** (`lib/production-needs.ts`): pure functions that
      roll registrations up into pieces-to-make, appliques-to-make, and supply
      demand. Reads `SeasonPieceConfig` + `AppliqueUsage` (real data), not
      hardcoded maps.
- [x] **Order List page** (`/orders`): supply/fabric demand minus quantity on
      hand, rounded up to the minimum order quantity, with estimated cost and
      supplier link. Shows what to buy and how much. Added to both nav bars.
- [x] **Appliques-to-make counts** surfaced on the Production page
      (`quantityPerCostume × registrations`, including appliques embedded in
      bodywear recipes).
- [x] **Production page rewired** to derive pieces from `SeasonPieceConfig`
      (falls back to defaults only when a costume type is not yet configured).

---

## Costume Costing & Profit (DONE)

Cost, selling price, and profit per costume category, with configurable policies.

- [x] **Yardage guide baked in** (`lib/yardage.ts`) from the Master Size Chart &
      Spandex Yardage Guide: auto-estimates fabric per made piece by size,
      editable.
- [x] **Per-piece sourcing** (`PieceSourcing`): each piece is independently either
      **bought finished** (enter price) or **made** (fabric yardage × $/yd +
      labor; labor 0 = sewn in-house). Pieces sum to a full costume.
- [x] **Selling price per costume type** (`CostumePricing`) with cost, profit, and
      margin per costume, plus season net revenue / cost / profit totals.
- [x] **Configurable model policy** (`AppSettings`): "$150 discount" (any amount)
      or "fully free", applied to the profit math with a model give-away figure.
- [x] **Configurable make-cost method**: include gems/appliques in a made piece's
      cost, or count fabric + labor only.
- [x] **Costing page** (`/costing`) + a settings popup for the policies above.

### Costing follow-ups
- [x] Feed sourcing into the Order List: `buy_finished` pieces become a "Finished
      pieces to buy" section and are excluded from material demand; `make` pieces
      drive fabric-yardage demand.
- [x] Size-accurate fabric demand: fabric is summed from each registration's
      actual size via the yardage guide, not a per-type average.
- [x] Show costing on the dashboard (net profit tile).

## Social Media Planner (DONE)

Turns a short onboarding into a ready-to-post content plan.

- [x] **Onboarding wizard** (`/social`, pops on first open): section name, colors +
      codes, slogan, description, then strategy (goals, platforms, cadence, tone,
      audience) and key dates (registration open/close, band launch, carnival,
      custom dates).
- [x] **Brand profile** stored per season (`SocialProfile`), editable anytime.
- [x] **Content plan generator** (`lib/social-plan.ts`): builds a dated posting
      schedule with tone-aware draft captions, hashtags, and platform hints
      (section intro, registration open/close, costume reveals, model showcase,
      shirts, countdowns, band launch), each with copy-to-clipboard.
- [x] Added to sidebar and mobile nav.

### Social follow-ups
- [ ] Optional AI-written captions (Anthropic API): swap `draftCaption` for a
      server route; needs an API key in the environment. Templates stay as
      fallback.
- [ ] Save/edit individual posts and mark them as posted.
- [ ] Export the plan to CSV / a shareable calendar.

## Tier 2 — Operational polish

Make the season easier to run day to day.

- [ ] **Build the `/reports` page.** It is in the sidebar, mobile nav, and role
      permissions but does not exist (dead link / 404). At minimum: registrations
      by type and gender, revenue vs outstanding balance, production % complete,
      order-list total. Reuse `lib/production-needs.ts` for the production and
      order numbers.
- [ ] **Build the `/inventory` page** (also a dead nav link). Show
      `InventoryItem` / `GemSupply` stock, storage location, and let the team
      adjust `quantityOnHand`. This closes the loop so the Order List reflects
      real stock.
- [ ] **Low-stock alerts.** `reorderThreshold` exists on the schema but nothing
      uses it. Flag supplies at or below threshold on the dashboard and the Order
      List.
- [ ] **Size-level cut sheets.** The Production page shows size breakdowns per
      tier; turn that into a per-piece, per-size cut list a cutter can work from
      (e.g. "12 Youth-M Tops, 8 Adult-S").
- [ ] **PDF / print export.** `jspdf` is installed but only wired into
      registrations. Add export to the Order List (supplier order sheet) and the
      cut sheets. Group the order sheet by supplier.
- [ ] **De-hardcode the season.** `const SEASON = "2026"` is repeated across
      pages (dashboard, production, orders, appliques). Add a season selector that
      reads the `seasons` collection and threads the active season through the
      pages.
- [ ] **Dashboard tie-ins.** Fill the "Costume Pieces" and "Appliques" stat cards
      (currently `—`) with real totals from the engine, and add an "Order List
      total" tile.

---

## Tier 3 — Multi-tenancy (prerequisite for selling to other bands)

Right now every collection is global and the band name / season are hardcoded, so
the app cannot be adopted by another section leader without editing code. This is
also the prerequisite for the planned `/display` camp board (see CLAUDE.md).

- [ ] **Add a `bandId` to every Firestore collection** and every read/write query
      (registrations, seasons, gemSupplies, appliques, appliqueUsages,
      pieceIngredients, bodywearRecipes, seasonPieceConfigs, masterPieces,
      productionPieces, seasonPieceSteps, parentShirts, users).
- [ ] **Firestore security rules** scoping every document to the caller's band.
- [ ] **Signup that creates or joins a band workspace**, with an invite flow for
      registrars / production team.
- [ ] **Per-band configuration** for what is currently hardcoded: band name
      (dashboard shows "The Black Stars"), costume types, size groups, the
      piece-to-costume map, and the current season.
- [ ] **Per-band URL** (subdomain or workspace slug).
- [ ] **Then** build the read-only `/display` camp board on top of the band layer
      (auto-refresh, Wake Lock, large high-contrast production status).

---

## Notes for whoever picks this up

- The production/order math lives in one place: `lib/production-needs.ts`. Build
  reports and cut sheets on top of it rather than recomputing.
- `AppliqueUsage` is the authoritative source for how many of each applique to
  make (it carries `quantityPerCostume` + costume type). The engine deliberately
  does not also count `PieceIngredient` appliques, to avoid double counting.
- Keep the Order List honest: it can only be as accurate as `quantityOnHand`,
  piece recipes, and applique assignments. The Tier 2 inventory page is what keeps
  on-hand numbers current.
