import '@testing-library/jest-dom/vitest'
import { getDemo } from '@/data'

// Sin latencia simulada en pruebas.
getDemo().setMockLatency(0)
