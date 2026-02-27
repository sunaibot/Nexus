import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface StoreState {
  [key: string]: any
}

export interface StoreActions {
  setState: (key: string, value: any) => void
  getState: (key: string) => any
  resetState: () => void
}

export interface StoreContextValue {
  state: StoreState
  actions: StoreActions
}

const initialState: StoreState = {}

const StoreContext = createContext<StoreContextValue | null>(null)

interface StoreProviderProps {
  children: ReactNode
  initialState?: StoreState
}

export function StoreProvider({ children, initialState: customInitialState }: StoreProviderProps) {
  const [state, setState] = useState<StoreState>(customInitialState || initialState)

  const setStoreState = useCallback((key: string, value: any) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  const getStoreState = useCallback((key: string) => {
    return state[key]
  }, [state])

  const resetStoreState = useCallback(() => {
    setState(customInitialState || initialState)
  }, [customInitialState])

  const value: StoreContextValue = {
    state,
    actions: {
      setState: setStoreState,
      getState: getStoreState,
      resetState: resetStoreState,
    },
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}

export function useStoreState<T>(key: string): [T, (value: T) => void] {
  const { state, actions } = useStore()
  const value = state[key] as T
  const setValue = useCallback((newValue: T) => {
    actions.setState(key, newValue)
  }, [actions, key])
  return [value, setValue]
}
