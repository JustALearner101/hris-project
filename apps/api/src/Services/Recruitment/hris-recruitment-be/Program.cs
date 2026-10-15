using Microsoft.EntityFrameworkCore;
using hris_recruitment_be.database;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<RecruitmentDbContext>(options =>
    options.UseInMemoryDatabase(""));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Recruitment API v1");
    c.RoutePrefix = "swagger";
});

app.MapControllers();
app.Run();
