export interface Meta {
  meta: {
    count: number;
    page: number;
    next: string | null;
    previous: string | null;
    total_pages: number;
    total_results: number;
  };
}
