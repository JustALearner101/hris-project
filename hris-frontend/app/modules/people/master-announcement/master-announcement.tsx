import AnnouncementTableCard from "@/components/people-component/announcement/announcement-table"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {Separator} from "@/components/ui/separator";

export default function MasterAnnouncementPage() {
    return (
        <main className="mx-auto max-w-[1200px] p-4 md:p-6">
            <section aria-label="Master Announcement" className="space-y-4">
                <header className="space-y-2">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">People</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Master Announcement</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-2xl font-semibold tracking-tight text-pretty">Master Announcement</h1>
                    <p className="text-sm text-muted-foreground">
                        Create, schedule, and manage company-wide announcements with multi-channel delivery and engagement tracking.
                    </p>
                </header>

                <Separator className="my-6" />

                <AnnouncementTableCard />
            </section>
        </main>
    )
}