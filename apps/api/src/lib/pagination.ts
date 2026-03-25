const DEFAULT_PER_PAGE = 25
const DEFAULT_MAX_PER_PAGE = 50
const DEFAULT_PAGE = 1

/**
 * Parse pagination using one-index for page.
 */
export function parsePagination(params: { page?: number; perPage?: number }) {
  const perPage = Math.min(params.perPage ?? DEFAULT_PER_PAGE, DEFAULT_MAX_PER_PAGE)
  const page = params.page ?? DEFAULT_PAGE
  const validPerPage = isNaN(perPage) || perPage < 1 ? DEFAULT_PER_PAGE : perPage
  const validPage = isNaN(page) || page < 1 ? DEFAULT_PAGE : page
  return {
    perPage: validPerPage,
    page: validPage,
    offset: (validPage - 1) * validPerPage,
  }
}

export function totalPages(total: number, perPage: number): number {
  if (perPage === 0) throw new Error('perPage must be greater than 0')
  return Math.ceil(total / perPage)
}
