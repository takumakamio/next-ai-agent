/**
 * Client-side typed API fetcher utilities for Hono RPC client.
 *
 * Use in React client components where you need type-safe API calls.
 *
 * @example
 * ```ts
 * import { rpc } from '@/lib/rpc'
 * import { clientFetch, clientPost } from '@/lib/client-fetcher'
 *
 * // GET request
 * const data = await clientFetch(rpc.api.qas, { query: { page: 1, limit: 10 } })
 *
 * // POST request
 * const created = await clientPost(rpc.api.qas, { question: 'What is TypeScript?' })
 * ```
 *
 * @module
 */

import type { ClientRequestOptions, InferResponseType } from 'hono/client'

// Hono client endpoint shape - using generics for precise method signatures
type HonoGetEndpoint<A = unknown> = {
  $get: (args: A, options?: ClientRequestOptions) => Promise<Response>
}

type HonoPostEndpoint<A = unknown> = {
  $post: (args: A, options?: ClientRequestOptions) => Promise<Response>
}

type HonoPatchEndpoint<A = unknown> = {
  $patch: (args: A, options?: ClientRequestOptions) => Promise<Response>
}

type HonoDeleteEndpoint<A = unknown> = {
  $delete: (args: A, options?: ClientRequestOptions) => Promise<Response>
}

// Helper type to extract the args type from endpoint's method
type ExtractGetArgs<T> = T extends { $get: (args: infer A, options?: ClientRequestOptions) => Promise<Response> }
  ? A
  : never

type ExtractPostArgs<T> = T extends { $post: (args: infer A, options?: ClientRequestOptions) => Promise<Response> }
  ? A
  : never

type ExtractPatchArgs<T> = T extends { $patch: (args: infer A, options?: ClientRequestOptions) => Promise<Response> }
  ? A
  : never

type ExtractDeleteArgs<T> = T extends { $delete: (args: infer A, options?: ClientRequestOptions) => Promise<Response> }
  ? A
  : never

// Helper type to extract the method from an endpoint
type GetMethod<T> = T extends { $get: infer M } ? M : never
type PostMethod<T> = T extends { $post: infer M } ? M : never
type PatchMethod<T> = T extends { $patch: infer M } ? M : never
type DeleteMethod<T> = T extends { $delete: infer M } ? M : never

// Helper types to get the response types from methods
type Get200Response<T> = InferResponseType<GetMethod<T>, 200>
type PostSuccessResponse<T> = InferResponseType<PostMethod<T>, 200> | InferResponseType<PostMethod<T>, 201>
type Patch200Response<T> = InferResponseType<PatchMethod<T>, 200>
type Delete200Response<T> = InferResponseType<DeleteMethod<T>, 200>

/**
 * Recursively process an object for JSON serialization
 * @param obj - The object to process
 * @returns A new object with Date objects converted to ISO strings
 */
async function processFilesInObject<T>(obj: T): Promise<T> {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Handle Date objects - convert to ISO string for JSON serialization
  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    const results = await Promise.all(obj.map((item) => processFilesInObject(item)))
    return results as unknown as T
  }

  // Handle plain objects
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    const entries = Object.entries(obj as Record<string, unknown>)

    for (const [key, value] of entries) {
      result[key] = await processFilesInObject(value)
    }

    return result as T
  }

  // Return primitives as-is
  return obj
}

/**
 * Client-side typed GET request.
 *
 * @example
 * ```ts
 * const data = await clientFetch(rpc.api.qas, { query: { page: 1 } })
 * ```
 */
export async function clientFetch<T extends HonoGetEndpoint<ExtractGetArgs<T>>>(
  endpoint: T,
  options?: ExtractGetArgs<T>,
): Promise<Get200Response<T>> {
  const response = await endpoint.$get(options as ExtractGetArgs<T>)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error((error as { error?: string }).error || `GET failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<Get200Response<T>>
}

/**
 * Client-side typed POST request.
 *
 * Automatically handles Date objects in the body by converting to ISO strings.
 *
 * @example
 * ```ts
 * const result = await clientPost(rpc.api.qas, { question: 'What is React?', answer: '...', category: 'programming' })
 * ```
 */
export async function clientPost<T extends HonoPostEndpoint<ExtractPostArgs<T>>>(
  endpoint: T,
  body: unknown,
  options?: Omit<ExtractPostArgs<T>, 'json'>,
): Promise<PostSuccessResponse<T>> {
  // Process any File objects and Date objects in the body
  const processedBody = await processFilesInObject(body)

  const args = { json: processedBody, ...options } as ExtractPostArgs<T>
  const response = await endpoint.$post(args)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    const errorMessage =
      (error as { message?: string }).message ||
      (error as { error?: string }).error ||
      `POST failed: ${response.status} ${response.statusText}`
    throw new Error(errorMessage)
  }

  return response.json() as Promise<PostSuccessResponse<T>>
}

/**
 * Client-side typed PATCH request.
 *
 * Automatically handles File objects in the body (same as clientPost).
 *
 * @example
 * ```ts
 * const updated = await clientPatch(rpc.api.qas[':id'], formData, { param: { id: '123' } })
 * ```
 */
export async function clientPatch<T extends HonoPatchEndpoint<ExtractPatchArgs<T>>>(
  endpoint: T,
  body?: unknown,
  options?: Omit<ExtractPatchArgs<T>, 'json'>,
): Promise<Patch200Response<T>> {
  // Process any File objects and Date objects in the body
  const processedBody = body ? await processFilesInObject(body) : body

  const args = { json: processedBody, ...options } as ExtractPatchArgs<T>
  const response = await endpoint.$patch(args)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error((error as { error?: string }).error || `PATCH failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<Patch200Response<T>>
}

/**
 * Client-side typed DELETE request.
 *
 * @example
 * ```ts
 * await clientDelete(rpc.api.qas[':id'], { param: { id: '123' } })
 * ```
 */
export async function clientDelete<T extends HonoDeleteEndpoint<ExtractDeleteArgs<T>>>(
  endpoint: T,
  options?: ExtractDeleteArgs<T>,
): Promise<Delete200Response<T>> {
  const response = await endpoint.$delete(options as ExtractDeleteArgs<T>)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error((error as { error?: string }).error || `DELETE failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<Delete200Response<T>>
}
