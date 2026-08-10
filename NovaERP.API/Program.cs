using Microsoft.AspNetCore.Http;
using NovaERP.API.Extensions;
using NovaERP.API.Services;
using NovaERP.Application.DependencyInjection;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Infrastructure.DependencyInjection;
using NovaERP.Infrastructure.Persistence.Context;
using NovaERP.Infrastructure.Persistence.Seed;
using Serilog;

namespace NovaERP.API;

public class Program
{
    public static async Task Main(string[] args)
    {
        // Configure Serilog
        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(
                new ConfigurationBuilder()
                    .AddJsonFile("appsettings.json")
                    .Build())
            .CreateLogger();

        try
        {
            Log.Information("Starting NovaERP API...");

            Log.Information("Creating WebApplicationBuilder...");
            var builder = WebApplication.CreateBuilder(args);

            // Configure Serilog
            Log.Information("Configuring Serilog...");
            builder.Host.UseSerilog();

            // Controllers
            Log.Information("Registering Controllers...");
            builder.Services.AddControllers();

            // HttpContext
            Log.Information("Registering HttpContextAccessor...");
            builder.Services.AddHttpContextAccessor();

            // Current User Service
            Log.Information("Registering CurrentUserService...");
            builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

            // Application Layer
            Log.Information("Registering Application Layer...");
            builder.Services.AddApplication();

            // Infrastructure Layer
            Log.Information("Registering Infrastructure Layer...");
            builder.Services.AddInfrastructure(builder.Configuration);

            // JWT Authentication
            Log.Information("Registering JWT Authentication...");
            builder.Services.AddJwtAuthentication(builder.Configuration);

            // Permission Authorization Engine
            Log.Information("Registering Permission Authorization Engine...");
            builder.Services.AddPermissionAuthorization();

            // CORS
            Log.Information("Registering CORS...");
            builder.Services.AddCorsPolicies();

            // Swagger
            Log.Information("Registering Swagger...");
            builder.Services.AddSwaggerDocumentation();

            // Build
            Log.Information("Building Application...");
            var app = builder.Build();

            // Apply Migrations & Seed Database
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                Log.Information("Applying migrations and seeding database...");
                await DbSeeder.SeedAsync(context);
            }

            Log.Information("Application Built Successfully.");

            // Swagger
            if (app.Environment.IsDevelopment())
            {
                app.UseSwaggerDocumentation();
            }

            // Middleware
            Log.Information("Registering Global Exception Handler...");
            app.UseGlobalExceptionHandler();

            Log.Information("Enabling Serilog Request Logging...");
            app.UseSerilogRequestLogging();

            Log.Information("Enabling CORS...");
            app.UseCorsPolicies();

            Log.Information("Enabling Authentication...");
            app.UseAuthentication();

            Log.Information("Enabling Authorization...");
            app.UseAuthorization();

            // Controllers
            Log.Information("Mapping Controllers...");
            app.MapControllers();

            Log.Information("Starting Web Server...");

            await app.RunAsync();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "NovaERP API terminated unexpectedly.");
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }
}