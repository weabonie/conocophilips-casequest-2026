import { resetRegisteredStores } from './store.js'
const DEMO_KEYS = ['cq_prototype_inventory_v2', 'cq_prototype_parts_requests_v1', 'cq_prototype_maintenance_requests_v1', 'cq_demo_session', 'cq_activity_log', 'cq_hse_gate', 'cq_min_max', 'cq_warning_decisions', 'cq_notification_reads', 'cq_activity_filters']
export function resetDemoState() { for (const key of DEMO_KEYS) { try { globalThis.localStorage?.removeItem(key) } catch { /* Keep sync preferences. */ } } resetRegisteredStores(); if (typeof window !== 'undefined') window.dispatchEvent(new Event('cq-demo-reset')) }
