namespace NovaERP.Application.DTOs.Sales;

public class SalesOrderItemDto
{
    public Guid Id { get; set; }
    public Guid SalesOrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "ea";
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal ReservedQuantity { get; set; }
    public decimal ShippedQuantity { get; set; }
}
