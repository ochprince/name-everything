import { describe, it, expect, afterEach } from 'vitest'
import { isQuark } from './isQuark'

const UA = {
  safariIOS:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.5 Mobile/15E148 Safari/604.1',
  quarkIosIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_8 like Mac OS X; zh-cn) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/22H352 Quark/10.16.0.3166 Mobile',
  quarkIosPc:
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
}

function withUA(ua: string, fn: () => void) {
  const original = navigator.userAgent
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value: ua,
  })
  try {
    fn()
  } finally {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: original,
    })
  }
}

describe('isQuark', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'userAgent')
  })

  it('detects Quark iOS (iPhone UA mode)', () => {
    withUA(UA.quarkIosIphone, () => {
      expect(isQuark()).toBe(true)
    })
  })

  it('does not flag Safari iOS', () => {
    withUA(UA.safariIOS, () => {
      expect(isQuark()).toBe(false)
    })
  })

  it('misses Quark iOS with PC UA spoof (known limitation)', () => {
    withUA(UA.quarkIosPc, () => {
      expect(isQuark()).toBe(false)
    })
  })
})
