using System;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace NovaERP.API.Extensions;

public static class CorsExtensions
{
    public static IServiceCollection AddCorsPolicies(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
            ?? Array.Empty<string>();

        var envOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) 
            ?? Array.Empty<string>();

        var allConfigured = configuredOrigins.Concat(envOrigins).ToArray();

        services.AddCors(options =>
        {
            options.AddPolicy("NovaERPCors", policy =>
            {
                policy
                    .SetIsOriginAllowed(origin =>
                    {
                        if (string.IsNullOrWhiteSpace(origin)) return false;
                        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;

                        // Allow localhost and local loopback on any port
                        if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                            uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
                        {
                            return true;
                        }

                        // Allow Render frontend domains (*.onrender.com)
                        if (uri.Host.EndsWith(".onrender.com", StringComparison.OrdinalIgnoreCase))
                        {
                            return true;
                        }

                        // Allow Vercel or Netlify hosting if configured
                        if (uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase) ||
                            uri.Host.EndsWith(".netlify.app", StringComparison.OrdinalIgnoreCase))
                        {
                            return true;
                        }

                        // Allow explicitly configured origins
                        if (allConfigured.Any(o => o.Equals(origin, StringComparison.OrdinalIgnoreCase)))
                        {
                            return true;
                        }

                        return false;
                    })
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }

    public static IApplicationBuilder UseCorsPolicies(
        this IApplicationBuilder app)
    {
        app.UseCors("NovaERPCors");
        return app;
    }
}
