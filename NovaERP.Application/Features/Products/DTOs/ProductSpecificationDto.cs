namespace NovaERP.Application.Features.Products.DTOs;

public class ProductSpecificationDto
{
    public Guid Id { get; set; }
    public string AttributeName { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
