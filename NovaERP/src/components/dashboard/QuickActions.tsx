import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, PackagePlus, ArrowRightLeft } from "lucide-react";

export function QuickActions() {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button variant="outline" className="group h-14 w-full justify-start transition-all hover:-translate-y-0.5 hover:shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <PackagePlus className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
          <span className="font-medium">Add New Product</span>
        </Button>
        <Button variant="outline" className="group h-14 w-full justify-start transition-all hover:-translate-y-0.5 hover:shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <FileText className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
          <span className="font-medium">Create Purchase Order</span>
        </Button>
        <Button variant="outline" className="group h-14 w-full justify-start transition-all hover:-translate-y-0.5 hover:shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <PlusCircle className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
          <span className="font-medium">New Production Order</span>
        </Button>
        <Button variant="outline" className="group h-14 w-full justify-start transition-all hover:-translate-y-0.5 hover:shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowRightLeft className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
          <span className="font-medium">Transfer Inventory</span>
        </Button>
      </CardContent>
    </Card>
  );
}
