/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import { useLiveOperations } from '../hooks/useLiveOperations'
import { setHseGateData } from '../domain/hseGate.js'
import { setPartsData } from '../domain/partsRequests.js'
const DataContext = createContext(null)
export function DataProvider({ children }) { const live = useLiveOperations(); setHseGateData(live.data); setPartsData(live.data); return <DataContext.Provider value={live}>{children}</DataContext.Provider> }
export function useData() { return useContext(DataContext)?.data }
export function useDataControls() { return useContext(DataContext) }
