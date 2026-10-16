# Public Career Portal Feature (`features/careers`)

Provides the candidate-facing public job board, SEO-friendly job detail views, UU PDP No. 27/2022 compliant application submission with multipart CV upload, and real-time application status tracking.

## Key Modules
- `types/careers.ts`: DTO contracts (`PublicJobDto`, `PublicJobDetailDto`, `ApplicationAcceptedDto`, `ApplicationStatusDto`) and `applyApplicationSchema` Zod validation.
- `api/use-careers.ts`: SWR hooks (`usePublicJobs`, `usePublicJobBySlug`, `useApplicationStatus`) and XHR multipart uploader (`submitPublicApplication`) with `Idempotency-Key` support.
- `components/cv-upload.tsx`: Drag-and-drop PDF/DOC/DOCX uploader with 5 MB validation and progress feedback.
- `components/job-list.tsx`: Searchable and filterable public job board.
- `components/job-detail.tsx`: Role overview, compensation range, and application CTA.
- `components/apply-form.tsx`: Candidate application form enforcing UU PDP No. 27/2022 consent.
- `components/application-status.tsx`: Real-time tracker polling CV parse status (`PENDING` -> `PARSED` / `FAILED`) and pipeline stage.
