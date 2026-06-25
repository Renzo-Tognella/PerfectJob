// Spring Page serialized in the flat (DIRECT) shape the API returns:
// top-level totalElements/totalPages/number, not nested under a "page" object.
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
