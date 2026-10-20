# Stage 1: Runtime base
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Stage 2: SDK Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files for dependency caching
COPY ["NovaERP.API/NovaERP.API.csproj", "NovaERP.API/"]
COPY ["NovaERP.Application/NovaERP.Application.csproj", "NovaERP.Application/"]
COPY ["NovaERP.Domain/NovaERP.Domain.csproj", "NovaERP.Domain/"]
COPY ["NovaERP.Infrastructure/NovaERP.Infrastructure.csproj", "NovaERP.Infrastructure/"]

# Restore packages
RUN dotnet restore "NovaERP.API/NovaERP.API.csproj"

# Copy full source trees
COPY NovaERP.API/ NovaERP.API/
COPY NovaERP.Application/ NovaERP.Application/
COPY NovaERP.Domain/ NovaERP.Domain/
COPY NovaERP.Infrastructure/ NovaERP.Infrastructure/

WORKDIR "/src/NovaERP.API"
RUN dotnet build "NovaERP.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Stage 3: Publish
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "NovaERP.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Stage 4: Production image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
ENTRYPOINT ["dotnet", "NovaERP.API.dll"]
