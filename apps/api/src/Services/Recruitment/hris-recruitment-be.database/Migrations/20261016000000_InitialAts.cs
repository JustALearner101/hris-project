using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace hris_recruitment_be.database.Migrations
{
    [DbContext(typeof(RecruitmentDbContext))]
    [Migration("20261016000000_InitialAts")]
    public partial class InitialAts : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "ats");

            migrationBuilder.CreateTable(
                name: "tblt_candidates",
                schema: "ats",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    full_name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    email = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    phone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    source = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    consent_given = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    consent_timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblt_candidates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tblt_job_postings",
                schema: "ats",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    department = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    location = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    employment_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    job_status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    headcount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    salary_min = table.Column<decimal>(type: "numeric", nullable: true),
                    salary_max = table.Column<decimal>(type: "numeric", nullable: true),
                    currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "IDR"),
                    seo_slug = table.Column<string>(type: "character varying(220)", maxLength: 220, nullable: false),
                    seo_meta_title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    seo_meta_description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    logo_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    theme = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    opened_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    closed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblt_job_postings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tblt_job_stages",
                schema: "ats",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    job_posting_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    stage_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    sequence = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblt_job_stages", x => x.id);
                    table.ForeignKey(
                        name: "FK_tblt_job_stages_tblt_job_postings_job_posting_id",
                        column: x => x.job_posting_id,
                        principalSchema: "ats",
                        principalTable: "tblt_job_postings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tblt_applications",
                schema: "ats",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    job_posting_id = table.Column<int>(type: "integer", nullable: false),
                    candidate_id = table.Column<int>(type: "integer", nullable: false),
                    current_stage_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    applied_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    score = table.Column<decimal>(type: "numeric", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    hired_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    tracking_token_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    record_status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblt_applications", x => x.id);
                    table.ForeignKey(
                        name: "FK_tblt_applications_tblt_candidates_candidate_id",
                        column: x => x.candidate_id,
                        principalSchema: "ats",
                        principalTable: "tblt_candidates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tblt_applications_tblt_job_postings_job_posting_id",
                        column: x => x.job_posting_id,
                        principalSchema: "ats",
                        principalTable: "tblt_job_postings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_tblt_applications_tblt_job_stages_current_stage_id",
                        column: x => x.current_stage_id,
                        principalSchema: "ats",
                        principalTable: "tblt_job_stages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tblt_application_documents",
                schema: "ats",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    application_id = table.Column<int>(type: "integer", nullable: false),
                    doc_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    file_name = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    storage_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    mime_type = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    content_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    parse_status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    extracted_text = table.Column<string>(type: "text", nullable: true),
                    parsed_json = table.Column<string>(type: "text", nullable: true),
                    error_code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    attempt_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblt_application_documents", x => x.id);
                    table.ForeignKey(
                        name: "FK_tblt_application_documents_tblt_applications_application_id",
                        column: x => x.application_id,
                        principalSchema: "ats",
                        principalTable: "tblt_applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tblt_application_submissions",
                schema: "ats",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    idempotency_key = table.Column<string>(type: "character varying(140)", maxLength: 140, nullable: false),
                    application_id = table.Column<int>(type: "integer", nullable: false),
                    request_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    response_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblt_application_submissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_tblt_application_submissions_tblt_applications_application_id",
                        column: x => x.application_id,
                        principalSchema: "ats",
                        principalTable: "tblt_applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tblt_interviews",
                schema: "ats",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    application_id = table.Column<int>(type: "integer", nullable: false),
                    stage_id = table.Column<int>(type: "integer", nullable: false),
                    scheduled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    duration_min = table.Column<int>(type: "integer", nullable: false, defaultValue: 60),
                    mode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    calendar_provider = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    calendar_event_id = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    interviewer_emails = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    record_status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblt_interviews", x => x.id);
                    table.ForeignKey(
                        name: "FK_tblt_interviews_tblt_applications_application_id",
                        column: x => x.application_id,
                        principalSchema: "ats",
                        principalTable: "tblt_applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_tblt_interviews_tblt_job_stages_stage_id",
                        column: x => x.stage_id,
                        principalSchema: "ats",
                        principalTable: "tblt_job_stages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tblt_offers",
                schema: "ats",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    application_id = table.Column<int>(type: "integer", nullable: false),
                    template_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    content = table.Column<string>(type: "text", nullable: true),
                    salary = table.Column<decimal>(type: "numeric", nullable: false),
                    currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    esign_ref = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    record_status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    created_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    modified_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    modified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblt_offers", x => x.id);
                    table.ForeignKey(
                        name: "FK_tblt_offers_tblt_applications_application_id",
                        column: x => x.application_id,
                        principalSchema: "ats",
                        principalTable: "tblt_applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tblt_candidates_email",
                schema: "ats",
                table: "tblt_candidates",
                column: "email",
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "IX_tblt_candidates_phone",
                schema: "ats",
                table: "tblt_candidates",
                column: "phone");

            migrationBuilder.CreateIndex(
                name: "IX_tblt_job_postings_seo_slug",
                schema: "ats",
                table: "tblt_job_postings",
                column: "seo_slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tblt_job_stages_job_posting_id_sequence",
                schema: "ats",
                table: "tblt_job_stages",
                columns: new[] { "job_posting_id", "sequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tblt_applications_job_posting_id_candidate_id",
                schema: "ats",
                table: "tblt_applications",
                columns: new[] { "job_posting_id", "candidate_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tblt_applications_job_posting_id_status",
                schema: "ats",
                table: "tblt_applications",
                columns: new[] { "job_posting_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_tblt_applications_tracking_token_hash",
                schema: "ats",
                table: "tblt_applications",
                column: "tracking_token_hash");

            migrationBuilder.CreateIndex(
                name: "IX_tblt_application_documents_application_id",
                schema: "ats",
                table: "tblt_application_documents",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "IX_tblt_application_submissions_idempotency_key",
                schema: "ats",
                table: "tblt_application_submissions",
                column: "idempotency_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tblt_interviews_application_id",
                schema: "ats",
                table: "tblt_interviews",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "IX_tblt_interviews_scheduled_at",
                schema: "ats",
                table: "tblt_interviews",
                column: "scheduled_at");

            migrationBuilder.CreateIndex(
                name: "IX_tblt_offers_application_id",
                schema: "ats",
                table: "tblt_offers",
                column: "application_id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "tblt_application_documents", schema: "ats");
            migrationBuilder.DropTable(name: "tblt_application_submissions", schema: "ats");
            migrationBuilder.DropTable(name: "tblt_interviews", schema: "ats");
            migrationBuilder.DropTable(name: "tblt_offers", schema: "ats");
            migrationBuilder.DropTable(name: "tblt_applications", schema: "ats");
            migrationBuilder.DropTable(name: "tblt_job_stages", schema: "ats");
            migrationBuilder.DropTable(name: "tblt_candidates", schema: "ats");
            migrationBuilder.DropTable(name: "tblt_job_postings", schema: "ats");
        }
    }
}
