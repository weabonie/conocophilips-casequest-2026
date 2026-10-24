# W7: Activity log and notifications

**Wave:** 1
**Priority:** P1
**Suggested agent:** `frontend-builder`
**Depends on:** G0

## Goal

Turn the append-only activity stream into an auditable, searchable timeline and derive restrained prototype notifications from it.
Notifications are mocked in-app only, except that email delivery is represented as a clearly labelled preview.

## Read first

1. `docs/roadmap/README.md`, sections 6 through 8.
2. Product guide 5.9, 7, 8 and 9.
3. `src/domain/activityLog.js`, `src/domain/permissions.js`, and feature event names in README 7.3.

## You own

- `src/features/activity/**`
- `src/domain/notifications.js`
- `src/domain/notifications.test.js`

## You call (do not edit)

`useActivity`, `subscribeActivity`, `useCurrentUser`, `can`, `assertCan`, `createPersistentStore`, and the UI kit (`PageHeader`, `StatusBadge`, `EmptyState`, `PermissionNote`).

## Build

1. Create a searchable timeline with filters for event type, site, asset, actor, and date; show actor name, role, timestamp, reason, and relevant metadata.
2. Add CSV export for HSE supervisors and ops managers only. The export must contain precisely the filtered rows and use safe CSV escaping.
3. Implement notification derivation and persistent read state. Derive: unacknowledged warning without part, rush reorder older than four hours, red dispatch result, min breach daily digest, site release, newly overdue severity-5 action, and monthly KPI summary preview.
4. Deduplicate notifications by triggering event and state. An acknowledged warning must not create another notification.
5. Fill `NotificationBell.jsx` with unread count, accessible list, mark-read action, and links to the relevant route.
6. Export `ActivityFeedMini` from `widgets.jsx`.

## Acceptance criteria

- All decisions made in W1 through W4 appear with the right actor, timestamp, site or asset, and reason when required.
- Unauthorized users cannot export in the UI or domain layer.
- A newly raised warning without stock creates one notification for planner and site lead; acknowledgement suppresses repeat alerts.
- A site release notifies the site lead and ops manager.
- Notification count, filtering, and export survive refresh.
- Tests cover recipient selection, deduplication, export permission, and CSV escaping.

## Verify in the app

Generate actions as the planner and HSE supervisor, then inspect the activity timeline and bell at 1440 px and 375 px.
Save screenshots of a filtered audit trail, notification list, and export permission state.

## Out of scope

Real push, email, or background scheduling infrastructure.
