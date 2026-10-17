namespace NovaERP.Application.DTOs.Sales;

public class CreateSalesOrderItemDto
{
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "ea";
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
}
