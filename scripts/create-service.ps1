param (
    [Parameter(Mandatory=$true)]
    [string]$ServiceName
)

$ErrorActionPreference = "Stop"

# Capitalize & lowercase variants
$servicePascal = (Get-Culture).TextInfo.ToTitleCase($ServiceName)
$serviceLower = $ServiceName.ToLower()

Write-Host "🚀 Generating new microservice/service: '$servicePascal'..." -ForegroundColor Cyan

$baseDir = "hris-backend/src/Services/$servicePascal"
$slnPath = "hris-backend/Hris.Backend.sln"

if (Test-Path $baseDir) {
    Write-Error "Service directory '$baseDir' already exists!"
    exit 1
}

# 1. Create project directories
$libDir = "$baseDir/hris-$serviceLower-be.lib"
$viewDir = "$baseDir/hris-$serviceLower-be.view"
$dbDir = "$baseDir/hris-$serviceLower-be.database"
$serviceLayerDir = "$baseDir/hris-$serviceLower-be.service"
$apiDir = "$baseDir/hris-$serviceLower-be"

New-Item -ItemType Directory -Path $libDir, $viewDir, $dbDir, $serviceLayerDir, $apiDir -Force | Out-Null

# 2. Create .csproj files
Write-Host "📦 Creating project files (.csproj)..." -ForegroundColor Yellow

# Lib
$libCsproj = "$libDir/hris-$serviceLower-be.util.csproj"
@"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
"@ | Set-Content -Path $libCsproj

# View
$viewCsproj = "$viewDir/hris-$serviceLower-be.view.csproj"
@"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\hris-$serviceLower-be.lib\hris-$serviceLower-be.util.csproj" />
  </ItemGroup>
</Project>
"@ | Set-Content -Path $viewCsproj

# Database
$dbCsproj = "$dbDir/hris-$serviceLower-be.database.csproj"
@"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="9.0.0" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\hris-$serviceLower-be.lib\hris-$serviceLower-be.util.csproj" />
  </ItemGroup>
</Project>
"@ | Set-Content -Path $dbCsproj

# Service Layer
$serviceCsproj = "$serviceLayerDir/hris-$serviceLower-be.service.csproj"
@"
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\hris-$serviceLower-be.database\hris-$serviceLower-be.database.csproj" />
    <ProjectReference Include="..\hris-$serviceLower-be.view\hris-$serviceLower-be.view.csproj" />
    <ProjectReference Include="..\hris-$serviceLower-be.lib\hris-$serviceLower-be.util.csproj" />
  </ItemGroup>
</Project>
"@ | Set-Content -Path $serviceCsproj

# Web API Host
$apiCsproj = "$apiDir/hris-$serviceLower-be.csproj"
@"
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.11" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\hris-$serviceLower-be.service\hris-$serviceLower-be.service.csproj" />
    <ProjectReference Include="..\hris-$serviceLower-be.database\hris-$serviceLower-be.database.csproj" />
    <ProjectReference Include="..\hris-$serviceLower-be.view\hris-$serviceLower-be.view.csproj" />
    <ProjectReference Include="..\hris-$serviceLower-be.lib\hris-$serviceLower-be.util.csproj" />
  </ItemGroup>
</Project>
"@ | Set-Content -Path $apiCsproj

# 3. Create Structured C# Files (DTOs, Repositories, Models, Services, Controllers)
Write-Host "📝 Creating structured C# starter files (DTOs, Repositories, Models, Services)..." -ForegroundColor Yellow

# Models & Repositories in .database
New-Item -ItemType Directory -Path "$dbDir/Models", "$dbDir/Repositories" -Force | Out-Null
@"
namespace hris_$($serviceLower)_be.database.Models
{
    public class $($servicePascal)Item
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
"@ | Set-Content -Path "$dbDir/Models/$($servicePascal)Item.cs"

# DbContext
@"
using Microsoft.EntityFrameworkCore;
using hris_$($serviceLower)_be.database.Models;

namespace hris_$($serviceLower)_be.database
{
    public class $($servicePascal)DbContext : DbContext
    {
        public $($servicePascal)DbContext(DbContextOptions<$($servicePascal)DbContext> options) : base(options) { }
        public DbSet<$($servicePascal)Item> Items { get; set; } = null!;
    }
}
"@ | Set-Content -Path "$dbDir/$($servicePascal)DbContext.cs"

# Custom Repository Interface & Implementation in .database/Repositories
@"
using System.Threading.Tasks;
using hris_$($serviceLower)_be.database.Models;

namespace hris_$($serviceLower)_be.database.Repositories
{
    public interface I$($servicePascal)ItemRepository
    {
        Task<$($servicePascal)Item?> GetByIdAsync(int id);
    }

    public class $($servicePascal)ItemRepository : I$($servicePascal)ItemRepository
    {
        private readonly $($servicePascal)DbContext _context;
        public $($servicePascal)ItemRepository($($servicePascal)DbContext context) => _context = context;
        public async Task<$($servicePascal)Item?> GetByIdAsync(int id) => await _context.Items.FindAsync(id);
    }
}
"@ | Set-Content -Path "$dbDir/Repositories/$($servicePascal)ItemRepository.cs"

# DTOs & ViewModels in .view
New-Item -ItemType Directory -Path "$viewDir/DTOs", "$viewDir/ViewModels" -Force | Out-Null
@"
namespace hris_$($serviceLower)_be.view.DTOs
{
    public class $($servicePascal)ItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class Create$($servicePascal)ItemDto
    {
        public string Name { get; set; } = string.Empty;
    }
}
"@ | Set-Content -Path "$viewDir/DTOs/$($servicePascal)ItemDto.cs"

# Controller in Web API Host
New-Item -ItemType Directory -Path "$apiDir/Controllers" -Force | Out-Null
@"
using Microsoft.AspNetCore.Mvc;
using hris_$($serviceLower)_be.view.DTOs;

namespace hris_$($serviceLower)_be.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class $($servicePascal)Controller : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { status = "SUCCESS", message = "Service $servicePascal is active!" });
        }
    }
}
"@ | Set-Content -Path "$apiDir/Controllers/$($servicePascal)Controller.cs"

# Program.cs in Web API Host
@"
using Microsoft.EntityFrameworkCore;
using hris_$($serviceLower)_be.database;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<$($servicePascal)DbContext>(options =>
    options.UseInMemoryDatabase("$servicePascalDb"));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "$servicePascal API v1");
    c.RoutePrefix = "swagger";
});

app.MapControllers();
app.Run();
"@ | Set-Content -Path "$apiDir/Program.cs"

# 4. Add projects to Solution file
Write-Host "🔗 Adding generated projects to solution ($slnPath)..." -ForegroundColor Yellow
dotnet sln $slnPath add $libCsproj $viewCsproj $dbCsproj $serviceCsproj $apiCsproj

Write-Host "✅ Microservice '$servicePascal' successfully created with Repositories & DTOs folders at 'hris-backend/src/Services/$servicePascal'!" -ForegroundColor Green
