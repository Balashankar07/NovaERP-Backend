import apiClient from "./axios";
import { AxiosRequestConfig, AxiosError } from "axios";

/**
 * Standardized API response format expected from the backend.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | Record<string, string[]>;
}

export type ApiErrorType = 
  | "ValidationError" 
  | "BusinessRuleError" 
  | "AuthenticationError" 
  | "AuthorizationError" 
  | "NetworkError" 
  | "ServerError" 
  | "UnknownError";

export class ApiError extends Error {
  public fieldErrors: Record<string, string[]>;
  public statusCode: number;
  public type: ApiErrorType;

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {},
    statusCode: number = 400,
    type: ApiErrorType = "UnknownError"
  ) {
    super(message);
    this.name = "ApiError";
    this.fieldErrors = fieldErrors;
    this.statusCode = statusCode;
    this.type = type;
  }
}

/**
 * Normalizes an Axios error or standard error into our ApiError format.
 */
function normalizeError(error: any): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error && error.isAxiosError) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status || 0;
    const responseData = axiosError.response?.data;

    let type: ApiErrorType = "UnknownError";
    let message = axiosError.message;
    let fieldErrors: Record<string, string[]> = {};

    if (!axiosError.response) {
      type = "NetworkError";
      message = "Unable to connect to the server.";
    } else if (status === 401) {
      type = "AuthenticationError";
      message = responseData?.message || "Your session has expired or you are not authenticated.";
    } else if (status === 403) {
      type = "AuthorizationError";
      message = "You do not have permission to perform this action.";
    } else if (status === 500) {
      type = "ServerError";
      message = "An internal server error occurred.";
    } else if (status === 400 || status === 422 || status === 409) {
      type = status === 409 ? "BusinessRuleError" : "ValidationError";
      
      if (responseData) {
        if (typeof responseData === "object" && "title" in responseData && "errors" in responseData) {
          // RFC 7807 ProblemDetails
          message = responseData.title || "Validation failed";
          if (typeof responseData.errors === "object") {
            // Map generic object to field errors
            Object.keys(responseData.errors).forEach(key => {
              const val = responseData.errors[key];
              fieldErrors[key] = Array.isArray(val) ? val : [String(val)];
            });
          }
        } else if (typeof responseData === "object" && "success" in responseData && !responseData.success) {
          // Standard ApiResponse wrapper
          message = responseData.message || "Validation failed";
          if (responseData.errors) {
            if (Array.isArray(responseData.errors)) {
              fieldErrors["_general"] = responseData.errors;
            } else if (typeof responseData.errors === "object") {
              Object.keys(responseData.errors).forEach(key => {
                const val = responseData.errors[key];
                fieldErrors[key] = Array.isArray(val) ? val : [String(val)];
              });
            }
          }
        } else if (typeof responseData === "string") {
          message = responseData;
        } else if (responseData.message) {
          message = responseData.message;
        } else {
           message = "Invalid request or validation failed.";
        }
      } else {
        message = "Invalid request or validation failed.";
      }
      
      // Append the first specific field error to the generic message for better visibility
      if (Object.keys(fieldErrors).length > 0) {
        const firstKey = Object.keys(fieldErrors)[0];
        const firstError = fieldErrors[firstKey][0];
        // Don't append if it's already a descriptive message
        if (message === "One or more validation errors occurred." || message === "Validation failed") {
          message = `${firstKey}: ${firstError}`;
        } else {
          message = `${message} (${firstKey}: ${firstError})`;
        }
      }
    }

    return new ApiError(message, fieldErrors, status, type);
  }

  return new ApiError(
    error instanceof Error ? error.message : "An unexpected error occurred",
    {},
    500,
    "UnknownError"
  );
}

/**
 * Helper to unwrap the standard ApiResponse<T> format for successful requests.
 */
function unwrapResponse<T>(responseData: any): T {
  if (responseData && typeof responseData === "object" && "success" in responseData) {
    if (!responseData.success) {
      const errorMsg = responseData.message || "API reported an unsuccessful operation.";
      let fieldErrors: Record<string, string[]> = {};
      if (responseData.errors) {
        if (Array.isArray(responseData.errors)) {
          fieldErrors["_general"] = responseData.errors;
        } else {
          fieldErrors = responseData.errors as Record<string, string[]>;
        }
      }
      throw new ApiError(errorMsg, fieldErrors, 400, "BusinessRuleError");
    }
    return responseData.data as T;
  }
  return responseData as T;
}

const safeExecute = async <T>(apiCall: () => Promise<any>): Promise<T> => {
  try {
    const response = await apiCall();
    return unwrapResponse<T>(response.data);
  } catch (error) {
    throw normalizeError(error);
  }
};

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    safeExecute<T>(() => apiClient.get<ApiResponse<T> | T>(url, config)),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    safeExecute<T>(() => apiClient.post<ApiResponse<T> | T>(url, data, config)),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    safeExecute<T>(() => apiClient.put<ApiResponse<T> | T>(url, data, config)),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    safeExecute<T>(() => apiClient.patch<ApiResponse<T> | T>(url, data, config)),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    safeExecute<T>(() => apiClient.delete<ApiResponse<T> | T>(url, config))
};
