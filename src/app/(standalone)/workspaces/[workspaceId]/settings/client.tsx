"use client";

import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { EditWorkspaceForm } from "@/features/workspaces/components/edit-workspace-form";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

export const WorkspaceSettingsPageClient = () => {
   const workspaceId = useWorkspaceId();
   const {data: initailValues, isLoading} = useGetWorkspace({ workspaceId })
   if(isLoading) return <PageLoader />
   if(!initailValues) return <PageError message="Workspace not Found" />
   return (
      <div className="w-full lg:max-w-xl">
        <EditWorkspaceForm initialValues={initailValues} />
      </div>
   )
}