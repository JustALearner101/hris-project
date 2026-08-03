# Multi-stage Dockerfile untuk ASP.NET Core 9.0 Web API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files dan restore dependencies
COPY ["Hris.Domain/Hris.Domain.csproj", "Hris.Domain/"]
COPY ["Hris.Application/Hris.Application.csproj", "Hris.Application/"]
COPY ["Hris.Infrastructure/Hris.Infrastructure.csproj", "Hris.Infrastructure/"]
COPY ["Hris.WebAPI/Hris.WebAPI.csproj", "Hris.WebAPI/"]
RUN dotnet restore "Hris.WebAPI/Hris.WebAPI.csproj"

# Copy sisa source code dan build
COPY . .
WORKDIR "/src/Hris.WebAPI"
RUN dotnet build "Hris.WebAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Hris.WebAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Hris.WebAPI.dll"]
