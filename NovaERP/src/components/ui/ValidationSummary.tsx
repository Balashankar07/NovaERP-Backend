import { AlertCircle } from "lucide-react";

interface ValidationSummaryProps {
  errors: string[];
  title?: string;
}

export function ValidationSummary({ errors, title = "Please correct the following errors:" }: ValidationSummaryProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md" role="alert" aria-live="polite">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <ul className="mt-2 text-sm text-red-700 list-disc pl-5 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
