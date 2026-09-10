type QueryValue = string | number | boolean | null | undefined;

export interface Options {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  // `object` aceita DTOs tipados (interfaces sem index signature); FormData é
  // tratado à parte no api.client antes do stringify.
  body?: object | FormData;
  params?: Record<string, QueryValue | QueryValue[]>;
}

export interface FetchResponse<T> {
  data: T;
  message: string | null;
}
