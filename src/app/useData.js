import { useContext } from 'react'
import { DataContext } from './dataContext.js'

export function useData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used inside DataProvider')
  return value
}
