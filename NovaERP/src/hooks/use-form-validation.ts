import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { ApiError } from "@/lib/api-helper";
import { toast } from "@/utils/toast";

interface UseFormValidationOptions<TFieldValues extends Record<string, any>> {
  form: UseFormReturn<TFieldValues>;
}

export function useFormValidation<TFieldValues extends Record<string, any>>({ 
  form 
}: UseFormValidationOptions<TFieldValues>) {
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearGlobalErrors = useCallback(() => {
    setGlobalErrors([]);
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      if (error.type === "ValidationError" || error.type === "BusinessRuleError") {
        const unmappedErrors: string[] = [];
        
        // If there are general errors, add them to the global summary
        if (error.fieldErrors["_general"]) {
          unmappedErrors.push(...error.fieldErrors["_general"]);
        }

        // Map field errors to react-hook-form
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          if (field === "_general") return;
          
          // Try to match the backend field name to the frontend form field.
          // In many cases, backend fields are PascalCase while frontend are camelCase.
          const camelCaseField = field.charAt(0).toLowerCase() + field.slice(1);
          
          // We can check if the field exists in the form's default values or registered fields.
          // For safety, we'll try camelCase first, then exact match.
          const formFields = Object.keys(form.getValues());
          const matchField = formFields.includes(camelCaseField) ? camelCaseField 
                           : formFields.includes(field) ? field 
                           : null;

          if (matchField) {
            form.setError(matchField as any, { 
              type: "server", 
              message: messages[0] // React hook form usually shows one error per field
            });
          } else {
            // If the field doesn't map to a UI input, add it to the global summary
            unmappedErrors.push(`${field}: ${messages.join(", ")}`);
          }
        });

        // Always show the main message in the summary if we have unmapped errors
        if (unmappedErrors.length > 0) {
          setGlobalErrors(unmappedErrors);
        } else if (error.message && error.message !== "Validation failed") {
           // If all fields were mapped, but there's a meaningful top-level message
           setGlobalErrors([error.message]);
        }
      } else {
        // For other ApiError types (NetworkError, ServerError, etc.), use a toast or general error
        toast.error(error.message);
        setGlobalErrors([error.message]);
      }
    } else {
      // Fallback for non-ApiErrors
      const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error(msg);
      setGlobalErrors([msg]);
    }
  }, [form]);

  /**
   * Wraps a submit handler to automatically manage isSubmitting state,
   * clear previous errors, and catch API errors.
   */
  const withValidation = useCallback((submitFn: (data: TFieldValues) => Promise<any>) => {
    return async (data: TFieldValues) => {
      clearGlobalErrors();
      setIsSubmitting(true);
      try {
        await submitFn(data);
      } catch (error) {
        handleApiError(error);
        // Don't rethrow, the error is handled and displayed in the UI
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [clearGlobalErrors, handleApiError]);

  return {
    globalErrors,
    setGlobalErrors,
    clearGlobalErrors,
    handleApiError,
    withValidation,
    isSubmitting
  };
}
