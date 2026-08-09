"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { SkillFormFields } from "@/components/skills/skill-form-fields";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import {
  skillFormSchema,
  type SkillFormValues,
} from "@/lib/skills/schema";
import type { ListSkillsResult, SkillDetail } from "@/lib/skills/types";
import type { ListToolsResult } from "@/lib/tools/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type EditSkillPageProps = {
  workspaceId: string;
  workspaceIndex: number;
  skillId: string;
};

async function fetchSkill(
  workspaceId: string,
  skillId: string,
): Promise<SkillDetail> {
  const res = await workspaceFetch(workspaceId, `/api/skills/${skillId}`);
  const data = (await res.json()) as SkillDetail & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load skill.");
  }

  return data;
}

async function fetchSkills(workspaceId: string): Promise<ListSkillsResult> {
  const res = await workspaceFetch(workspaceId, "/api/skills?limit=100");
  const data = (await res.json()) as ListSkillsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load skills.");
  }

  return data;
}

async function fetchTools(workspaceId: string): Promise<ListToolsResult> {
  const res = await workspaceFetch(workspaceId, "/api/tools?limit=100");
  const data = (await res.json()) as ListToolsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load tools.");
  }

  return data;
}

function createEditDefaultValues(skill: SkillDetail): SkillFormValues {
  return {
    name: skill.name,
    slug: skill.slug,
    description: skill.description ?? "",
    instructions: skill.instructions,
    tools: skill.tools,
  };
}

export function EditSkillPage({
  workspaceId,
  workspaceIndex,
  skillId,
}: EditSkillPageProps) {
  const router = useRouter();
  const skillsHref = getDashboardNavHref(workspaceIndex, "skills");

  const {
    data: skill,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["skill", workspaceId, skillId],
    queryFn: () => fetchSkill(workspaceId, skillId),
  });

  const { data: skillsData } = useQuery({
    queryKey: ["skills", workspaceId],
    queryFn: () => fetchSkills(workspaceId),
  });

  const { data: toolsData } = useQuery({
    queryKey: ["tools", workspaceId],
    queryFn: () => fetchTools(workspaceId),
  });

  const usedSlugSet = useMemo(() => {
    const slugs = (skillsData?.items ?? [])
      .filter((item) => item.id !== skillId)
      .map((item) => item.slug);

    return new Set(slugs);
  }, [skillsData?.items, skillId]);

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      instructions: "",
      tools: [],
    },
  });

  useEffect(() => {
    if (!skill) {
      return;
    }

    form.reset(createEditDefaultValues(skill));
  }, [skill, form]);

  async function onSubmit(values: SkillFormValues) {
    const res = await workspaceFetch(workspaceId, `/api/skills/${skillId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { message?: string; error?: string };

    if (res.ok) {
      toast.add({
        title: data.message ?? "Skill updated.",
        type: "success",
      });
      router.push(skillsHref);
      return;
    }

    toast.add({
      title: data.error ?? data.message ?? "Something went wrong.",
      type: "error",
    });
  }

  const isSubmitting = form.formState.isSubmitting;
  const slugValue = form.watch("slug");
  const slugTaken =
    slugValue.trim().length > 0 && usedSlugSet.has(slugValue.trim());

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
        <div className="mb-6 space-y-4">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
        <div className="mb-6 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={skillsHref} />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to skills
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Could not open skill</CardTitle>
            <CardDescription>
              {error?.message ?? "This skill could not be loaded."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button nativeButton={false} render={<Link href={skillsHref} />}>
              Back to skills
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <div className="mb-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={skillsHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to skills
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Edit skill</h1>
          <p className="text-sm text-muted-foreground">
            Update instructions and tool access for {skill.name}.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Skill details</CardTitle>
            <CardDescription>
              Name, slug, instructions, and optional tools for this skill.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkillFormFields
              idPrefix="edit-skill"
              register={form.register}
              watch={form.watch}
              setValue={form.setValue}
              errors={form.formState.errors}
              disabled={isSubmitting}
              workspaceTools={toolsData?.items ?? []}
              usedSlugs={usedSlugSet}
              showSlugWarning
            />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              nativeButton={false}
              render={<Link href={skillsHref} />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || slugTaken}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
