import type { AppType } from '@/app/api/[[...route]]/route'
import { ROOT_URL } from '@/lib/constants'
import { hc } from 'hono/client'

export const rpc = hc<AppType>(ROOT_URL)
