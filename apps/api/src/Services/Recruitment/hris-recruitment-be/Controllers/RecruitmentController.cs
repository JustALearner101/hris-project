using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Hris.TokenValidation;
using hris_recruitment_be.lib.DefaultDTO;
using hris_recruitment_be.lib.Utils;
using hris_recruitment_be.view.DTOs;

namespace hris_recruitment_be.Controllers
{
    [ApiController]
    [Route("api/health")]
    [AllowAnonymous]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetHealth()
        {
            return Ok(new
            {
                status = "healthy",
                service = "hris-recruitment-be",
                timestamp = DateTime.UtcNow.ToString("O")
            });
        }
    }

    [ApiController]
    [Route("api/v1/auth")]
    [AllowAnonymous]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public ActionResult<DefaultDtoResponse<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                var err = BuildResponseUtil.Error<LoginResponseDto>("Email and password are required.", "ERR_VALIDATION");
                return BadRequest(err);
            }

            var requestedRole = string.IsNullOrWhiteSpace(dto.Role) ? "HR Admin" : dto.Role.Trim();
            var lifetime = TimeSpan.FromHours(8);
            var token = Hris.TokenValidation.JwtBearerExtensions.IssueToken(
                userId: dto.Email.Trim().ToLowerInvariant(),
                email: dto.Email.Trim().ToLowerInvariant(),
                role: requestedRole,
                configuration: _configuration,
                lifetime: lifetime);

            var responseDto = new LoginResponseDto
            {
                Token = token,
                Email = dto.Email.Trim().ToLowerInvariant(),
                Role = requestedRole,
                ExpiresAt = DateTime.UtcNow.Add(lifetime)
            };

            return Ok(BuildResponseUtil.Success(new List<LoginResponseDto> { responseDto }, 1, "info", "Authenticated successfully."));
        }
    }
}
