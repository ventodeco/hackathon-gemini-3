import { useState, useCallback } from 'react'

export type DrawerState = 'closed' | 'collapsed' | 'expanded'

const DRAWER_HEIGHTS: Record<DrawerState, string> = {
  closed: '0%',
  collapsed: '35vh',
  expanded: '75vh',
}

const DRAG_THRESHOLD = 50
const VELOCITY_THRESHOLD = 500

interface UseDrawerHeightReturn {
  drawerState: DrawerState
  height: string
  expandDrawer: () => void
  collapseDrawer: () => void
  closeDrawer: () => void
  setDrawerState: (state: DrawerState) => void
}

export function useDrawerHeight(): UseDrawerHeightReturn {
  const [drawerState, setDrawerState] = useState<DrawerState>('closed')

  const height = DRAWER_HEIGHTS[drawerState]

  const expandDrawer = useCallback(() => {
    setDrawerState('expanded')
  }, [])

  const collapseDrawer = useCallback(() => {
    setDrawerState('collapsed')
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerState('closed')
  }, [])

  const setDrawerStateDirect = useCallback((state: DrawerState) => {
    setDrawerState(state)
  }, [])

  return {
    drawerState,
    height,
    expandDrawer,
    collapseDrawer,
    closeDrawer,
    setDrawerState: setDrawerStateDirect,
  }
}

export function useDrawerGestures(
  onExpand: () => void,
  onCollapse: () => void
) {
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { y: number }; velocity: { y: number } }) => {
      const { offset, velocity } = info

      if (offset.y < -DRAG_THRESHOLD || velocity.y < -VELOCITY_THRESHOLD) {
        onExpand()
      } else if (offset.y > DRAG_THRESHOLD || velocity.y > VELOCITY_THRESHOLD) {
        onCollapse()
      }
    },
    [onExpand, onCollapse]
  )

  return { handleDragEnd }
}
