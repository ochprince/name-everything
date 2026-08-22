import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ProgressProvider } from '../hooks/useProgress'

export function renderWithProgress(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    ...options,
    wrapper: ({ children }) => (
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProgressProvider>{children}</ProgressProvider>
      </MemoryRouter>
    ),
  })
}
