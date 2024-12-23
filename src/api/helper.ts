import { z } from "zod";
import { instance, instanceWithoutInterceptors } from "./axios";
import { AxiosRequestConfig, Method } from "axios";

interface APICallPayload<Request, Response> {
  method: Method;
  path: string | ((data: Request) => string);
  requestSchema: z.ZodType<Request>;
  responseSchema: z.ZodType<Response>;
  type?: "private" | "public";
  headers?: AxiosRequestConfig["headers"];
}

export function api<Request, Response>({
  type = "private",
  method,
  path,
  requestSchema,
  headers,
  responseSchema,
}: APICallPayload<Request, Response>) {
  return async (requestData: Request) => {
    try {
      if (!(requestData instanceof FormData)) {
        requestSchema.parse(requestData);
      }
    } catch (error) {
      console.error("❌ Request validation failed:", error);
      throw error;
    }

    const url = typeof path === "function" ? path(requestData) : path;
    let params = null;
    let data = null;

    if (requestData) {
      if (method === "GET") {
        params = requestData;
      } else if (method === "DELETE") {
        params = null;
      } else {
        data = requestData;
      }
    }

    const config: AxiosRequestConfig = {
      method,
      url,
      params,
      data,
      headers: {
        ...headers,
        ...(requestData instanceof FormData && {
          "Content-Type": "multipart/form-data",
        }),
      },
    };

    try {
      const response =
        type === "private"
          ? await instance(config)
          : await instanceWithoutInterceptors(config);

      if (responseSchema instanceof z.ZodVoid) {
        return undefined as Response;
      }
      try {
        const validatedResponse = responseSchema.parse(response.data);
        return validatedResponse;
      } catch (error) {
        console.error("❌ Response validation failed:", error);
        return response.data as Response;
      }
    } catch (error) {
      console.error("❌ API Call Failed:", error);
      throw error;
    }
  };
}
