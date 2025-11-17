import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexAction, convexQuery } from "@convex-dev/react-query";
import { useAppForm } from "@/src/hooks/useAppForm";
import { z } from "zod";
import { ScrapeStatusBadge } from "@/src/routes/_authed/_customer/selectedApp/-editor/ScrapeStatusBadge";

interface NewScrapeFormProps {
  appId: Id<"apps">;
  onComplete: (result: Record<string, string>, url: string) => void;
}

export function NewScrapeForm({ appId, onComplete }: NewScrapeFormProps) {
  const [currentJobId, setCurrentJobId] = useState<Id<"scrapeJobs"> | null>(
    null,
  );

  const startScrapeJob = useConvexAction(api.firecrawl.startScrapeJob);
  const { mutateAsync } = useMutation({
    mutationFn: async (url: string) => {
      return startScrapeJob({
        appId,
        url,
      });
    },
    onError: () => {
      toast.error("Failed to start scraping");
    },
  });

  const form = useAppForm({
    defaultValues: {
      url: "",
    },
    validators: {
      onChange: z.object({
        url: z.url(),
      }),
    },
    onSubmit: async ({ value }) => {
      const jobId = await mutateAsync(value.url);
      setCurrentJobId(jobId);
      toast.success("Scraping started in background");
    },
  });

  const { data: currentJob } = useQuery({
    ...convexQuery(api.scrapeJobs.getScrapeJobStatus, { jobId: currentJobId! }),
    enabled: !!currentJobId,
  });

  useEffect(() => {
    if (!currentJob) return;

    if (currentJob.status === "completed" && currentJob.result) {
      try {
        const result = JSON.parse(currentJob.result);
        onComplete(result, currentJob.url);
        setCurrentJobId(null);
        form.reset();
        toast.success(`Scraped ${Object.keys(result).length} text items`);
      } catch (error) {
        toast.error("Failed to parse scrape results");
        form.reset();
        setCurrentJobId(null);
      }
    } else if (currentJob.status === "failed") {
      toast.error(currentJob.error || "Scraping failed");
      setCurrentJobId(null);
    }
  }, [currentJob, onComplete]);

  return (
    <div className="flex flex-col gap-4 py-4 p-4">
      <div className="grid gap-2">
        <form.Form onSubmit={form.handleSubmit}>
          <form.AppField name="url">
            {(field) => (
              <field.TextField
                label="Website URL"
                placeholder="https://example.com"
                required
              />
            )}
          </form.AppField>
          <form.AppForm>
            <form.SubmitButton loadingText="Scraping...">
              Scrape
            </form.SubmitButton>
          </form.AppForm>
        </form.Form>
        <p className="text-xs">
          AI will extract all text content in the background. You can close this
          and check back later.
        </p>
      </div>

      {currentJobId && currentJob && (
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Job</span>
            <ScrapeStatusBadge status={currentJob.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {currentJob.url}
          </p>
          {currentJob.error && (
            <p className="text-xs text-destructive">{currentJob.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
