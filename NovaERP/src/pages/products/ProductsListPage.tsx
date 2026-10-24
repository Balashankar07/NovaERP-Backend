import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, Box, RefreshCw } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useCrudTable } from "@/hooks/use-crud-table";
import { toast } from "@/utils/toast";
import { formatCurrency } from "@/utils/formatters";
import { productsApi } from "@/api/products.api";
import { ProductDto, ProductType } from "@/types/products.types";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { LoadingView, ErrorView } from "@/components/ui/state-views";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/page-shell";
import { PermissionButton } from "@/components/common/permission-button";
import { Input } from "@/components/ui/input";

import { ProductFormDialog } from "./components/ProductFormDialog";
import { ProductDetailsDialog } from "./components/ProductDetailsDialog";

export default function ProductsListPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission("Permissions.Products.View");
  const canCreate = hasPermission("Permissions.Products.Create");
  const canUpdate = hasPermission("Permissions.Products.Update");
  const canDelete = hasPermission("Permissions.Products.Delete");
  
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [activeTab, setActiveTab] = useState<ProductType | null>(null);

  const {
    viewState,
    data,
    queryParams,
    searchInput,
    setSearchInput,
    handleSearch,
    toggleSort,
    setPage,
    updateQueryParam,
    refresh
  } = useCrudTable<ProductDto>({
    fetchFn: productsApi.getAll,
    defaultSortBy: "ProductNumber",
    defaultSortOrder: "desc",
    defaultPageSize: 20
  });

  const handleTabChange = (type: ProductType | null) => {
    setActiveTab(type);
    updateQueryParam("productType", type === null ? undefined : type);
  };

  const handleCreateOrUpdate = async (formData: any) => {
    if (selectedProduct) {
      await productsApi.update(selectedProduct.id, formData);
      toast.success(`Product "${formData.name}" updated successfully.`);
    } else {
      await productsApi.create(formData);
      toast.success(`Product "${formData.name}" created successfully.`);
    }
    setIsFormOpen(false);
    refresh();
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);

    try {
      await productsApi.delete(selectedProduct.id);
      toast.success("Product deleted successfully.");
      setIsDeleteOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openForm = (product?: ProductDto) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const openDetails = (product: ProductDto) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const openDelete = (product: ProductDto) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const getProductTypeBadge = (type: ProductType) => {
    if (type === ProductType.FinishedGood) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Finished Good</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Component</span>;
  };

  const renderedRows = useMemo(() => {
    if (viewState === "loading") {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-64">
            <LoadingView />
          </TableCell>
        </TableRow>
      );
    }
    
    if (viewState === "error") {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-64">
            <ErrorView description="Failed to load products" onRetry={refresh} />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "empty" || (viewState === "success" && data?.items.length === 0)) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-64">
            <EmptyState 
              icon={<Box className="w-8 h-8 text-slate-400" />}
              title="No products found" 
              description={queryParams.search ? "Try adjusting your search query." : "Add your first product to get started."}
              action={canCreate ? { label: "Add Product", onClick: () => openForm() } : undefined}
            />
          </TableCell>
        </TableRow>
      );
    }

    if (viewState === "success" && data) {
      return data.items.map((product) => (
        <TableRow key={product.id} className="group transition-colors hover:bg-slate-50/50">
          <TableCell className="pl-4">
            <div className="h-10 w-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
              <ImageWithFallback src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            </div>
          </TableCell>
          <TableCell className="font-medium text-slate-700 truncate" title={product.productNumber}>{product.productNumber}</TableCell>
          <TableCell className="font-medium text-slate-900 truncate" title={product.name}>{product.name}</TableCell>
          <TableCell>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-700 truncate" title={product.productCode}>{product.productCode}</span>
              <span className="text-xs text-slate-500 truncate" title={product.sku}>{product.sku}</span>
            </div>
          </TableCell>
          <TableCell>{getProductTypeBadge(product.productType)}</TableCell>
          <TableCell className="text-slate-600 truncate" title={product.brand?.name || "-"}>{product.brand?.name || "-"}</TableCell>
          <TableCell className="text-slate-600 truncate" title={product.category?.name || "-"}>{product.category?.name || "-"}</TableCell>
          <TableCell className="text-slate-900 font-medium text-right tabular-nums">{formatCurrency(product.sellingPrice)}</TableCell>
          <TableCell>
            <StatusBadge isActive={product.isActive} />
          </TableCell>
          <TableCell className="text-right pr-6">
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600" onClick={() => openDetails(product)} title="View Details" aria-label={`View Details for ${product.name}`}>
                <Eye className="w-4 h-4" />
              </Button>
              {canUpdate && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => openForm(product)} title="Edit Product" aria-label={`Edit ${product.name}`}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-600" onClick={() => openDelete(product)} title="Delete Product" aria-label={`Delete ${product.name}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      ));
    }
    return null;
  }, [viewState, data, queryParams.search, canCreate, canUpdate, canDelete]);

  if (!canView) {
    return <ErrorView title="Access Denied" description="You don't have permission to view products." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Products Management"
        description="Manage master products, variants, and pricing."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9" onClick={refresh} title="Refresh Data">
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
            <PermissionButton 
              permission="Permissions.Products.Create"
              onClick={() => openForm()} 
              aria-label="Add Product"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </PermissionButton>
          </div>
        }
      />

      <SectionCard className="p-0 flex flex-col relative">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-slate-100 gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => handleTabChange(null)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === null ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              All Products
            </button>
            <button
              onClick={() => handleTabChange(ProductType.FinishedGood)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === ProductType.FinishedGood ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Finished Goods
            </button>
            <button
              onClick={() => handleTabChange(ProductType.Component)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === ProductType.Component ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              Components
            </button>
          </div>
          
          <div className="w-full sm:w-72">
            <form onSubmit={handleSearch} className="relative">
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-9 bg-white"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Box className="w-4 h-4" />
              </div>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1000px] w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[60px] pl-4">Image</TableHead>
                <SortableHeader label="Number" field="ProductNumber" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[120px]" />
                <SortableHeader label="Product Name" field="Name" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[180px]" />
                <SortableHeader label="Code / SKU" field="ProductCode" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[130px]" />
                <TableHead className="w-[110px]">Type</TableHead>
                <SortableHeader label="Brand" field="Brand" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[120px]" />
                <SortableHeader label="Category" field="Category" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[120px]" />
                <SortableHeader label="Selling Price" field="SellingPrice" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="text-right w-[110px]" />
                <SortableHeader label="Status" field="Status" currentSortBy={queryParams.sortBy} currentSortOrder={queryParams.sortOrder} onSort={toggleSort} className="w-[90px]" />
                <TableHead className="text-right pr-6 w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderedRows}
            </TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              data={data}
              onPageChange={setPage}
            />
          </div>
        )}
      </SectionCard>

      <ProductFormDialog 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={selectedProduct}
        onSubmit={handleCreateOrUpdate}
      />

      {selectedProduct && (
        <ProductDetailsDialog
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          product={selectedProduct}
        />
      )}

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName="Product"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
