using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
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
        // Configure initial Console logger to capture any early startup errors
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .Enrich.FromLogContext()
            .WriteTo.Console()
            .CreateBootstrapLogger();

        try
        {
            Log.Information("Starting NovaERP API...");

            Log.Information("Creating WebApplicationBuilder...");
            var builder = WebApplication.CreateBuilder(args);

            // Bind to PORT provided dynamically by hosting environments (e.g. Render, Railway)
            var renderPort = Environment.GetEnvironmentVariable("PORT");
            if (!string.IsNullOrEmpty(renderPort))
            {
                builder.WebHost.UseUrls($"http://0.0.0.0:{renderPort}");
            }

            // Configure Serilog from Configuration (with fallback to Console)
            Log.Information("Configuring Serilog...");
            builder.Host.UseSerilog((context, services, configuration) => configuration
                .ReadFrom.Configuration(context.Configuration)
                .Enrich.FromLogContext()
                .WriteTo.Console());

            // Controllers
            Log.Information("Registering Controllers...");
            builder.Services.AddControllers().AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
            });

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
            builder.Services.AddCorsPolicies(builder.Configuration);

            // Swagger
            Log.Information("Registering Swagger...");
            builder.Services.AddSwaggerDocumentation();

            // Build
            Log.Information("Building Application...");
            var app = builder.Build();

            Log.Information("Application Built Successfully.");

            // Health & Root Endpoints for immediate cloud status checks
            app.MapGet("/", () => Results.Ok(new
            {
                service = "NovaERP API",
                status = "online",
                timestamp = DateTime.UtcNow
            }));

            app.MapGet("/health", () => Results.Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow
            }));

            // On-demand seeding & migration endpoint
            app.MapGet("/api/seed-database", async (AppDbContext context, IConfiguration config) =>
            {
                try
                {
                    Log.Information("Manual trigger: Seeding database...");
                    await DbSeeder.SeedAsync(context, config);
                    return Results.Ok(new { success = true, message = "Database seeded successfully!" });
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "Manual trigger seed failed.");
                    return Results.Problem(detail: ex.ToString(), title: "Seeding Failed");
                }
            });

            // Diagnostic endpoint to inspect applied/pending migrations and existing tables
            app.MapGet("/api/db-inspect", async (AppDbContext context) =>
            {
                try
                {
                    var applied = await context.Database.GetAppliedMigrationsAsync();
                    var pending = await context.Database.GetPendingMigrationsAsync();

                    var tables = new List<string>();
                    var columns = new List<string>();
                    using var conn = context.Database.GetDbConnection();
                    await conn.OpenAsync();

                    using (var cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;";
                        using var reader = await cmd.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            tables.Add(reader.GetString(0));
                        }
                    }

                    using (var cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "SELECT table_name || '.' || column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, column_name;";
                        using var reader = await cmd.ExecuteReaderAsync();
                        while (await reader.ReadAsync())
                        {
                            columns.Add(reader.GetString(0));
                        }
                    }

                    return Results.Ok(new
                    {
                        appliedMigrations = applied,
                        pendingMigrations = pending,
                        existingTables = tables,
                        existingColumns = columns
                    });
                }
                catch (Exception ex)
                {
                    return Results.Problem(detail: ex.ToString(), title: "Inspection Failed");
                }
            });

            // Swagger (available in Development or enabled for review in Production)
            if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("EnableSwagger", true))
            {
                app.UseSwaggerDocumentation();
            }

            // Middleware
            Log.Information("Enabling Serilog Request Logging...");
            app.UseSerilogRequestLogging();

            Log.Information("Enabling CORS...");
            app.UseCorsPolicies();
            
            Log.Information("Enabling Static Files...");
            app.UseStaticFiles();

            Log.Information("Registering Global Exception Handler...");
            app.UseGlobalExceptionHandler();

            Log.Information("Enabling Authentication...");
            app.UseAuthentication();

            Log.Information("Enabling Authorization...");
            app.UseAuthorization();

            // Controllers
            Log.Information("Mapping Controllers...");
            app.MapControllers();

            // Apply Migrations & Seed Database in a resilient background task
            // This ensures Kestrel binds to PORT immediately so Render health check succeeds without timing out
            _ = Task.Run(async () =>
            {
                await Task.Delay(1500); // Allow Kestrel to bind port and start listening first

                const int maxRetries = 10;
                for (int attempt = 1; attempt <= maxRetries; attempt++)
                {
                    try
                    {
                        Log.Information("Background DB initialization attempt {Attempt}/{MaxRetries}...", attempt, maxRetries);
                        using var scope = app.Services.CreateScope();
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

                        await DbSeeder.SeedAsync(context, configuration);
                        Log.Information("Database migrations and seeding completed successfully!");
                        break;
                    }
                    catch (Exception ex)
                    {
                        if (attempt < maxRetries)
                        {
                            Log.Warning("DB initialization attempt {Attempt}/{MaxRetries} failed ({Message}). Retrying in 10 seconds...", attempt, maxRetries, ex.Message);
                            await Task.Delay(10000);
                        }
                        else
                        {
                            Log.Error(ex, "DB initialization encountered errors after {MaxRetries} attempts. Web API remains live and serving requests.", maxRetries);
                        }
                    }
                }
            });

            Log.Information("Starting Web Server...");

            await app.RunAsync();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "NovaERP API terminated unexpectedly.");
            throw;
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }
}
