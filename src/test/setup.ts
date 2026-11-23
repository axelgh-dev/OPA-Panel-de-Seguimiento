import '@testing-library/jest-dom/vitest'
import { setMockLatency } from '@/data'

// Sin latencia simulada en pruebas.
setMockLatency(0)
