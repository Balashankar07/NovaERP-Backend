using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Interfaces.Repositories;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _context;

    public ProductRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<Product>> GetAllAsync(
        int pageNumber = 1,
        int pageSize = 20,
        string? search = null,
        string? sortBy = null,
        string? sortOrder = null,
        ProductType? productType = null)
    {
        var query = _context.Products
            .Include(x => x.Category)
            .Include(x => x.Brand)
            .Include(x => x.Unit)
            .AsQueryable();

        // Server-side product type filter
        if (productType.HasValue)
        {
            query = query.Where(x => x.Type == productType.Value);
        }

        // Search across: Name, ProductNumber, ProductCode, SKU, Barcode
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(x =>
                x.Name.Contains(s) ||
                x.ProductNumber.Contains(s) ||
                x.ProductCode.Contains(s) ||
                x.SKU.Contains(s) ||
                (x.Barcode != null && x.Barcode.Contains(s)));
        }

        // Sorting
        bool isDesc = sortOrder?.Equals("desc", StringComparison.OrdinalIgnoreCase) ?? true;
        query = sortBy?.ToLower() switch
        {
            "name" => isDesc
                ? query.OrderByDescending(x => x.Name).ThenByDescending(x => x.CreatedAt)
                : query.OrderBy(x => x.Name).ThenBy(x => x.CreatedAt),
            "productcode" or "code" => isDesc
                ? query.OrderByDescending(x => x.ProductCode)
                : query.OrderBy(x => x.ProductCode),
            "productnumber" => isDesc
                ? query.OrderByDescending(x => x.ProductNumber)
                : query.OrderBy(x => x.ProductNumber),
            "sku" => isDesc
                ? query.OrderByDescending(x => x.SKU).ThenByDescending(x => x.CreatedAt)
                : query.OrderBy(x => x.SKU).ThenBy(x => x.CreatedAt),
            "sellingprice" => isDesc
                ? query.OrderByDescending(x => x.SellingPrice).ThenByDescending(x => x.CreatedAt)
                : query.OrderBy(x => x.SellingPrice).ThenBy(x => x.CreatedAt),
            "createdat" => isDesc
                ? query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.ProductNumber)
                : query.OrderBy(x => x.CreatedAt).ThenBy(x => x.ProductNumber),
            // Default: newest first
            _ => query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.ProductNumber)
        };

        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 20 : pageSize;

        var totalCount = await query.CountAsync();
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<Product>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _context.Products
            .Include(x => x.Category)
            .Include(x => x.Brand)
            .Include(x => x.Unit)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Product?> GetByCodeAsync(string code)
    {
        return await _context.Products
            .FirstOrDefaultAsync(x => x.ProductCode == code);
    }

    public async Task<Product?> GetByProductNumberAsync(string productNumber)
    {
        return await _context.Products
            .FirstOrDefaultAsync(x => x.ProductNumber == productNumber);
    }

    public Task AddAsync(Product product)
    {
        _context.Products.AddAsync(product);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Product product)
    {
        _context.Products.Update(product);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Product product)
    {
        _context.Products.Remove(product);
        return Task.CompletedTask;
    }
}
