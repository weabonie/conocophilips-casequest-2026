import { resetRegisteredStores } from './store.js'
import { INVENTORY_STORAGE_KEY, PARTS_REQUESTS_STORAGE_KEY } from '../utils/inventoryStorage.js'

export function resetDemoState() {
  resetRegisteredStores()
  try {
    localStorage.removeItem(INVENTORY_STORAGE_KEY)
    localStorage.removeItem(PARTS_REQUESTS_STORAGE_KEY)
  } catch {
    // The persistent store reset remains safe when storage is unavailable.
  }
}
