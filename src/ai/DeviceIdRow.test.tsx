import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DEVICE_ID_STORAGE_KEY } from './deviceId'
import { DeviceIdRow } from './DeviceIdRow'

vi.mock('./allowance', () => {
  const isAiAllowed = vi.fn(async () => false)
  return {
    isAiAllowed,
    checkAiAllowedCached: vi.fn(async () => ({
      allowed: await isAiAllowed(),
      ok: true,
    })),
    isAiAllowedWithDetail: vi.fn(async () => ({
      allowed: await isAiAllowed(),
      ok: true,
    })),
    invalidateAiAllowCache: vi.fn(),
  }
})

import { isAiAllowed } from './allowance'

describe('DeviceIdRow', () => {
  const writeText = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      DEVICE_ID_STORAGE_KEY,
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    )
    writeText.mockClear()
    vi.mocked(isAiAllowed).mockResolvedValue(false)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  it('shows the 设备码 section, 未开通, and copies the full id', async () => {
    render(<DeviceIdRow />)
    expect(screen.getByText('设备码')).toBeInTheDocument()
    expect(await screen.findByText(/未开通/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '复制' }))
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      )
    })
    expect(
      await screen.findByRole('button', { name: '已复制' }),
    ).toBeInTheDocument()
  })

  it('shows 已开通 when allowed', async () => {
    vi.mocked(isAiAllowed).mockResolvedValue(true)
    render(<DeviceIdRow />)
    expect(await screen.findByText(/已开通/)).toBeInTheDocument()
  })
})
