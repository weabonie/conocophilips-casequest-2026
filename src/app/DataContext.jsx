/* eslint-disable react-refresh/only-export-components */
import { useContext } from 'react'
import { DataContext } from './dataContextStore.js'
import { useLiveOperations } from '../hooks/useLiveOperations'
import { setHseGateData } from '../domain/hseGate.js'
import { setPartsData } from '../domain/partsRequests.js'
export function DataProvider({ children }) { const live = useLiveOperations(); setHseGateData(live.data); setPartsData(live.data); return <DataContext.Provider value={live}>{children}</DataContext.Provider> }
export function useData() { return useContext(DataContext)?.data }
export function useDataControls() { return useContext(DataContext) }

export function ScopedDataProvider({ data, children }) { const controls = useDataControls(); return <DataContext.Provider value={{ ...controls, data }}>{children}</DataContext.Provider> }
