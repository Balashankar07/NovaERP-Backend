using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly AppDbContext _context;
    public TestController(AppDbContext context) { _context = context; }

    [HttpGet("verify")]
    public async Task<IActionResult> Verify()
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == "admin@novaerp.com");
        if (user == null) return NotFound("User not found");
        return Ok(new {
            user.Email,
            user.PasswordHash,
            user.IsActive,
            user.CompanyId
        });
    }
}
