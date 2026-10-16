import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CvUpload } from "@/features/careers/components/cv-upload";
import { ApplyForm } from "@/features/careers/components/apply-form";
import { PipelineBoard } from "@/features/recruitment/components/pipeline-board";
import { PublicJobDetailDto } from "@/features/careers/types/careers";
import { ApplicationDto } from "@/features/recruitment/types/recruitment";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({ slug: "senior-dotnet-engineer-a1b2c3" }),
}));

const mockJob: PublicJobDetailDto = {
  id: 101,
  title: "Senior .NET Backend Engineer",
  department: "Engineering",
  location: "Jakarta (Hybrid)",
  employmentType: "FULL_TIME",
  salaryMin: 20000000,
  salaryMax: 35000000,
  currency: "IDR",
  seoSlug: "senior-dotnet-engineer-a1b2c3",
  description: "Design and build distributed .NET 9 microservices.",
  headcount: 2,
  publishedAt: "2026-10-16T00:00:00Z",
};

const mockApplications: ApplicationDto[] = [
  {
    id: 501,
    jobPostingId: 101,
    jobTitle: "Senior .NET Backend Engineer",
    candidateId: 301,
    candidateName: "Dewi Lestari",
    candidateEmail: "dewi.lestari@example.com",
    candidatePhone: "+62812345678",
    currentStageId: 1,
    currentStageName: "Sourcing",
    currentStageType: "SOURCING",
    status: "APPLIED",
    appliedAt: "2026-10-16T01:00:00Z",
    cvParseStatus: "PARSED",
  },
  {
    id: 502,
    jobPostingId: 101,
    jobTitle: "Senior .NET Backend Engineer",
    candidateId: 302,
    candidateName: "Rizky Pratama",
    candidateEmail: "rizky.pratama@example.com",
    candidatePhone: "+62898765432",
    currentStageId: 2,
    currentStageName: "HR Screening",
    currentStageType: "SCREENING",
    status: "IN_REVIEW",
    appliedAt: "2026-10-16T02:00:00Z",
    cvParseStatus: "PENDING",
  },
];

describe("Recruitment ATS & Public Career Portal Components", () => {
  it("validates unsupported file extension and >5MB size in CvUpload", () => {
    const handleChange = jest.fn();
    render(<CvUpload value={null} onChange={handleChange} />);

    const input = screen.getByTestId("cv-file-input") as HTMLInputElement;

    const invalidExtFile = new File(["malicious"], "exploit.exe", {
      type: "application/x-msdownload",
    });
    fireEvent.change(input, { target: { files: [invalidExtFile] } });

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Unsupported file format/i
    );

    const oversizedBuffer = new Uint8Array(5 * 1024 * 1024 + 1024);
    const oversizedPdf = new File([oversizedBuffer], "huge-resume.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [oversizedPdf] } });

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/5 MB/i);

    const validPdf = new File(["%PDF-1.4 sample cv"], "candidate-cv.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [validPdf] } });
    expect(handleChange).toHaveBeenCalledWith(validPdf);
  });

  it("enforces UU PDP No. 27/2022 consent and required fields on ApplyForm", async () => {
    render(<ApplyForm job={mockJob} />);

    const submitBtn = screen.getByRole("button", {
      name: /Submit Application/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Full name must be at least 2 characters/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Please enter a valid email address/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/UU PDP No\. 27\/2022/i)).toBeInTheDocument();
    });
  });

  it("renders PipelineBoard columns, CV parse badges, and advances candidate stage", () => {
    const onMoveStage = jest.fn();
    const onSelectApplication = jest.fn();
    const onHire = jest.fn();
    const onReject = jest.fn();

    render(
      <PipelineBoard
        applications={mockApplications}
        onMoveStage={onMoveStage}
        onSelectApplication={onSelectApplication}
        onHire={onHire}
        onReject={onReject}
      />
    );

    expect(screen.getByText("Dewi Lestari")).toBeInTheDocument();
    expect(screen.getByText("Rizky Pratama")).toBeInTheDocument();
    expect(screen.getByText("PARSED")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();

    const advanceDewiBtn = screen.getByRole("button", {
      name: /Advance Dewi Lestari to HR Screening/i,
    });
    fireEvent.click(advanceDewiBtn);

    expect(onMoveStage).toHaveBeenCalledWith(
      mockApplications[0],
      "SCREENING"
    );
  });
});
