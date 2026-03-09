export type Bindings = {
  locale: string
  requestId: string
}

export type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export type PaginationData = {
  currentPage: number
  totalPages: number
  totalItems: number
  limit: number
}

export type Image = File | string

export type ImageFormat = 'avif' | 'webp' | 'jpg' | 'png'
