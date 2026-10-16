import { ApplicationStatus } from "@/features/careers/components/application-status";

export default async function ApplicationTrackerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ApplicationStatus token={token} />;
}
