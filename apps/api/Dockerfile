# Multi-stage Dockerfile untuk ASP.NET Core 9.0 Web API (eproc-be structure)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files dan restore dependencies
COPY ["src/Services/Master/hris-be/hris-be.csproj", "Services/Master/hris-be/"]
COPY ["src/Services/Master/hris-be.database/hris-be.database.csproj", "Services/Master/hris-be.database/"]
COPY ["src/Services/Master/hris-be.service/hris-be.service.csproj", "Services/Master/hris-be.service/"]
COPY ["src/Services/Master/hris-be.view/hris-be.view.csproj", "Services/Master/hris-be.view/"]
COPY ["src/Services/Master/hris-be.lib/hris-be.util.csproj", "Services/Master/hris-be.lib/"]
COPY ["src/Approval/Hris.Approval.csproj", "Approval/"]
COPY ["src/Email/Hris.Email.csproj", "Email/"]
COPY ["src/Logging/Hris.Logging.csproj", "Logging/"]
COPY ["src/Scheduler/Hris.Scheduler.csproj", "Scheduler/"]
COPY ["src/TokenValidation/Hris.TokenValidation.csproj", "TokenValidation/"]

RUN dotnet restore "Services/Master/hris-be/hris-be.csproj"

# Copy sisa source code dan build
COPY src/ .
WORKDIR "/src/Services/Master/hris-be"
RUN dotnet build "hris-be.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "hris-be.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "hris-be.dll"]
