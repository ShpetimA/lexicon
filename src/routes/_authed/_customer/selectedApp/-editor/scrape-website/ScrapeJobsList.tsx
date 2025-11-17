import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ScrapeStatusBadge } from "./ScrapeStatusBadge";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

interface ScrapeJobsListProps {
  appId: Id<"apps">;
  onViewResults: (jobId: Id<"scrapeJobs">) => void;
}

export function ScrapeJobsList({ appId, onViewResults }: ScrapeJobsListProps) {
  const { data: jobs } = useQuery(
    convexQuery(api.scrapeJobs.listUserScrapeJobs, { appId }),
  );

  if (!jobs) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-2">
      <div className="space-y-2 py-4">
        {jobs.length > 0 ? (
          jobs.map((job) => <JobItem job={job} onViewResults={onViewResults} />)
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent scrape jobs</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

const JobItem = ({
  job,
  onViewResults,
}: {
  job: Doc<"scrapeJobs">;
  onViewResults: (jobId: Id<"scrapeJobs">) => void;
}) => {
  return (
    <div
      key={job._id}
      className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate flex-1">{job.url}</span>
        <ScrapeStatusBadge status={job.status} />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{new Date(job.startedAt).toLocaleString()}</span>
        {job.status === "completed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewResults(job._id)}
          >
            View Results
          </Button>
        )}
      </div>
      {job.error && <p className="text-xs text-destructive">{job.error}</p>}
    </div>
  );
};
