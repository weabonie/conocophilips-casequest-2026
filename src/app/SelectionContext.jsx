/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'
const SelectionContext = createContext(null)
export function SelectionProvider({ children }) { const [selectedSite, setSelectedSite] = useState(null); return <SelectionContext.Provider value={{ selectedSite, setSelectedSite }}>{children}</SelectionContext.Provider> }
export function useSiteSelection() { return useContext(SelectionContext) }
