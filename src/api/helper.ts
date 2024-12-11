import { z } from "zod";
import { instance, instanceWithoutInterceptors } from "./axios";
import { AxiosRequestConfig, Method } from "axios";

interface APICallPayload<Request, Response> {
  method: Method;
  path: string;
  requestSchema: z.ZodType<Request>;
  responseSchema: z.ZodType<Response>;
  type?: "private" | "public";
}

export function api<Request, Response>({
  type = "private",
  method,
  path,
  requestSchema,
  responseSchema,
}: APICallPayload<Request, Response>) {
  return async (requestData: Request) => {
    try {
      requestSchema.parse(requestData);
    } catch (error) {
      console.error("❌ Request validation failed:", error);
      throw error;
    }

    let url = path;
    let params = null;
    let data = null;

    if (requestData) {
      if (method === "GET") {
        params = requestData;
      } else if (method === "DELETE") {
        url += `${requestData}`;
      } else {
        data = requestData;
      }
    }

    const config: AxiosRequestConfig = {
      method,
      url,
      params,
      data,
    };

    try {
      const response =
        type === "private"
          ? await instance(config)
          : await instanceWithoutInterceptors(config);

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
