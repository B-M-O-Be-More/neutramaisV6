"use client";

import React from "react";
import { useLoading } from "../useLoading/hook";
import { FetchResponse, Options } from "./interface";
import { Meta } from "@/interfaces/Meta";

const defaultPagination: Meta["meta"] = {
  count: 0,
  page: 1,
  next: null,
  previous: null,
  total_pages: 0,
  total_results: 0,
};

export default function useFetch<T>() {
  const [data, setData] = React.useState<T>();
  const [pagination, setPagination] =
    React.useState<Meta["meta"]>(defaultPagination);
  const { executeWithLoading, isLoading } = useLoading();

  const request = async (
    url: string,
    options: Options,
  ): Promise<FetchResponse<T>> => {
    const params = new URLSearchParams();

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(`${key}[]`, item));
        } else {
          params.append(key, String(value));
        }
      });
    }

    const headers: HeadersInit = {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    };

    const config: RequestInit = {
      method: options.method,
      headers,
    };

    if (options.method !== "GET" && options.body) {
      if (options.body instanceof FormData) {
        config.body = options.body;
      } else {
        config.body = JSON.stringify(options.body);
      }
    }

    try {
      const response = await executeWithLoading(() =>
        fetch(`${url}?${params.toString()}`, config),
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.message || "Fetch error");
      }

      setData(responseData.data as T);
      setPagination(responseData.meta || defaultPagination);

      return {
        data: responseData.data,
        message: responseData.message ?? null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";

      throw new Error(errorMessage);
    }
  };

  return [request, isLoading, data, pagination] as const;
}
