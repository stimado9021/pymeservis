export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function parsePagination(
  q?: PaginationQuery,
  defaultPageSize = 50,
): {
  page: number;
  pageSize: number;
  take: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(String(q?.page), 10) || 1);
  const pageSize = Math.max(
    1,
    parseInt(String(q?.pageSize), 10) || defaultPageSize,
  );
  return { page, pageSize, take: pageSize, skip: (page - 1) * pageSize };
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return { items, total, page, pageSize };
}