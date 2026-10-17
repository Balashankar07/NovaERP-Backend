import { Link } from "react-router-dom";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes";

export function NotFoundPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <FileQuestion className="h-10 w-10 text-indigo-600" />
        </div>
        
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">404</h1>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900">Page Not Found</h2>
        
        <p className="mb-8 text-gray-500">
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to={-1 as any}>
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to={ROUTES.DASHBOARD}>
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
