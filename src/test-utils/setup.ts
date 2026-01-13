import { expect, afterEach } from 'bun:test'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend bun's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
    cleanup()
})


