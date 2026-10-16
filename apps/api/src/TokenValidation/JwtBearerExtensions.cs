using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Hris.TokenValidation
{
    public static class JwtBearerExtensions
    {
        public const string DefaultSigningKey = "hris-ats-development-signing-key-at-least-32-bytes-long!";
        public const string DefaultIssuer = "hris-ats-auth";
        public const string DefaultAudience = "recruitment-api";

        public static IServiceCollection AddHrisAuth(this IServiceCollection services, IConfiguration configuration)
        {
            var authority = configuration["Auth:Authority"];
            var audience = configuration["Auth:Audience"] ?? DefaultAudience;
            var issuer = configuration["Auth:Issuer"] ?? DefaultIssuer;
            var signingKey = configuration["Auth:SigningKey"] ?? DefaultSigningKey;
            var requireHttps = bool.TryParse(configuration["Auth:RequireHttpsMetadata"], out var https) && https;

            var symmetricKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = requireHttps;
                if (!string.IsNullOrWhiteSpace(authority) &&
                    bool.TryParse(configuration["Auth:UseOidcMetadata"], out var useOidc) && useOidc)
                {
                    options.Authority = authority;
                }

                var validIssuers = new List<string> { issuer };
                if (!string.IsNullOrWhiteSpace(authority))
                {
                    validIssuers.Add(authority.TrimEnd('/'));
                }

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = symmetricKey,
                    ValidateIssuer = true,
                    ValidIssuers = validIssuers,
                    ValidateAudience = true,
                    ValidAudiences = new[] { audience, "account", "recruitment-web" },
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(2),
                    RoleClaimType = ClaimTypes.Role,
                    NameClaimType = ClaimTypes.NameIdentifier
                };

                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        if (context.Principal?.Identity is ClaimsIdentity identity)
                        {
                            // Map Keycloak realm_access.roles claim into standard ClaimTypes.Role
                            var realmAccessClaim = identity.FindFirst("realm_access");
                            if (realmAccessClaim != null && !string.IsNullOrWhiteSpace(realmAccessClaim.Value))
                            {
                                try
                                {
                                    using var doc = JsonDocument.Parse(realmAccessClaim.Value);
                                    if (doc.RootElement.TryGetProperty("roles", out var rolesElement) &&
                                        rolesElement.ValueKind == JsonValueKind.Array)
                                    {
                                        foreach (var roleItem in rolesElement.EnumerateArray())
                                        {
                                            var roleName = roleItem.GetString();
                                            if (!string.IsNullOrWhiteSpace(roleName) &&
                                                !identity.HasClaim(ClaimTypes.Role, roleName))
                                            {
                                                identity.AddClaim(new Claim(ClaimTypes.Role, roleName));
                                            }
                                        }
                                    }
                                }
                                catch
                                {
                                    // Ignore malformed realm_access claim
                                }
                            }

                            foreach (var roleClaim in identity.FindAll("role").ToList())
                            {
                                if (!identity.HasClaim(ClaimTypes.Role, roleClaim.Value))
                                {
                                    identity.AddClaim(new Claim(ClaimTypes.Role, roleClaim.Value));
                                }
                            }
                        }

                        return Task.CompletedTask;
                    }
                };
            });

            services.AddAuthorization(options =>
            {
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
            });

            return services;
        }

        public static string IssueToken(
            string userId,
            string email,
            string role,
            IConfiguration? configuration = null,
            TimeSpan? lifetime = null)
        {
            var issuer = configuration?["Auth:Issuer"] ?? DefaultIssuer;
            var audience = configuration?["Auth:Audience"] ?? DefaultAudience;
            var signingKey = configuration?["Auth:SigningKey"] ?? DefaultSigningKey;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim("role", role)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: DateTime.UtcNow.AddSeconds(-5),
                expires: DateTime.UtcNow.Add(lifetime ?? TimeSpan.FromHours(8)),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
