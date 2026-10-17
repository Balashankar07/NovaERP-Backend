interface FieldErrorProps {
  error?: string;
  id?: string;
}

export function FieldError({ error, id }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p 
      id={id} 
      className="text-sm font-medium text-red-500 mt-1.5"
      role="alert"
    >
      {error}
    </p>
  );
}
