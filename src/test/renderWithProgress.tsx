import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ProgressProvider } from '../hooks/useProgress'

export function renderWithProgress(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    ...options,
    wrapper: ({ children }) => <ProgressProvider>{children}</ProgressProvider>,
  })
}
