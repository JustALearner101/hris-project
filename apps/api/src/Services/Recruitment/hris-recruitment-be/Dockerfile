# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files for layer-cached restore
COPY ["src/TokenValidation/Hris.TokenValidation.csproj", "src/TokenValidation/"]
COPY ["src/Services/Recruitment/hris-recruitment-be/hris-recruitment-be.csproj", "src/Services/Recruitment/hris-recruitment-be/"]
COPY ["src/Services/Recruitment/hris-recruitment-be.service/hris-recruitment-be.service.csproj", "src/Services/Recruitment/hris-recruitment-be.service/"]
COPY ["src/Services/Recruitment/hris-recruitment-be.database/hris-recruitment-be.database.csproj", "src/Services/Recruitment/hris-recruitment-be.database/"]
COPY ["src/Services/Recruitment/hris-recruitment-be.view/hris-recruitment-be.view.csproj", "src/Services/Recruitment/hris-recruitment-be.view/"]
COPY ["src/Services/Recruitment/hris-recruitment-be.lib/hris-recruitment-be.util.csproj", "src/Services/Recruitment/hris-recruitment-be.lib/"]

RUN dotnet restore "src/Services/Recruitment/hris-recruitment-be/hris-recruitment-be.csproj"

# Copy source code and publish
COPY src/TokenValidation/ src/TokenValidation/
COPY src/Services/Recruitment/ src/Services/Recruitment/

WORKDIR "/src/src/Services/Recruitment/hris-recruitment-be"
RUN dotnet publish "hris-recruitment-be.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Create shared CV volume mount directory and run as non-root user
RUN mkdir -p /cv-data \
    && chown -R $APP_UID:$APP_UID /cv-data /app

USER $APP_UID
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8083 \
    CV_STORAGE_ROOT=/cv-data

EXPOSE 8083
ENTRYPOINT ["dotnet", "hris-recruitment-be.dll"]
