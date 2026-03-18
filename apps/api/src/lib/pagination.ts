/**
 * Parse pagination using one-index for page.
 */
export function parsePagination(params: { page?: number; perPage?: number }) {
  const perPage = Math.min(params.perPage ?? 50, 100)
  const page = params.page ?? 1
  const validPerPage = isNaN(perPage) || perPage < 1 ? 20 : perPage
  const validPage = isNaN(page) || page < 1 ? 1 : page
  return {
    perPage: validPerPage,
    page: validPage,
    offset: (validPage - 1) * validPerPage,
  }
}

export function totalPages(total: number, perPage: number): number {
  return Math.ceil(total / perPage)
}
