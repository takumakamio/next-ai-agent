import type { RootType } from '@/app/api/[[...route]]/route'
import { ROOT_URL } from '@/lib/constants'
import { hc } from 'hono/client'

export const rpc = hc<RootType>(ROOT_URL)
