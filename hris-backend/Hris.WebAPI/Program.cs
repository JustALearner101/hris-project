using Hris.Application.Interfaces;
using Hris.Application.Mappings;
using Hris.Application.Services;
using Hris.Domain.Interfaces;
using Hris.Infrastructure.Data;
using Hris.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Serilog;
using AutoMapper;
using FluentValidation;
using Hris.Application.Validators;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database Context
builder.Services.AddDbContext<HrisDbContext>(options =>
    options.UseInMemoryDatabase("HrisDb")); // Fallback to InMemory if SQL Server fails
    // options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Dependency Injection
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();

// Validation
// Validation
builder.Services.AddValidatorsFromAssemblyContaining<Hris.Application.Validators.EmployeeValidator>();

// Exception Handler
builder.Services.AddExceptionHandler<Hris.WebAPI.Middleware.GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
