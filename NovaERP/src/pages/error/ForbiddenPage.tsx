import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes";

export function ForbiddenPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <ShieldAlert className="h-10 w-10 text-red-600" />
        </div>
        
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">403</h1>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900">Access Forbidden</h2>
        
        <p className="mb-8 text-gray-500">
          You do not have the required permissions to access this page. If you believe this is an error, please contact an administrator.
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to={ROUTES.DASHBOARD}>
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
