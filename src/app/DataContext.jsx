import { useLiveOperations } from '../hooks/useLiveOperations.js'
import { DataContext } from './dataContext.js'

export function DataProvider({ children }) {
  const liveOperations = useLiveOperations()
  return <DataContext.Provider value={liveOperations}>{children}</DataContext.Provider>
}
