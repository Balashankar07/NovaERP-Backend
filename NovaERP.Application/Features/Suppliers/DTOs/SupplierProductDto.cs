namespace NovaERP.Application.Features.Suppliers.DTOs;

public class SupplierProductDto
{
    public Guid Id { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string SupplierSKU { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal MOQ { get; set; }
    public int LeadTimeDays { get; set; }
    public string Currency { get; set; } = string.Empty;
    public bool IsPreferred { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateSupplierProductDto
{
    public Guid SupplierId { get; set; }
    public Guid ProductId { get; set; }
    public string SupplierSKU { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal MOQ { get; set; }
    public int LeadTimeDays { get; set; }
    public string Currency { get; set; } = "USD";
    public bool IsPreferred { get; set; }
}

public class UpdateSupplierProductDto
{
    public string SupplierSKU { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal MOQ { get; set; }
    public int LeadTimeDays { get; set; }
    public string Currency { get; set; } = string.Empty;
    public bool IsPreferred { get; set; }
    public bool IsActive { get; set; }
}
