import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DEVICE_ID_STORAGE_KEY } from './deviceId'
import { DeviceIdRow } from './DeviceIdRow'

describe('DeviceIdRow', () => {
  const writeText = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      DEVICE_ID_STORAGE_KEY,
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    )
    writeText.mockClear()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  it('shows the 设备码 section and copies the full id', async () => {
    render(<DeviceIdRow />)
    expect(screen.getByText('设备码')).toBeInTheDocument()
    expect(screen.getByText('发给管理员以开通 AI 功能')).toBeInTheDocument()
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
})
