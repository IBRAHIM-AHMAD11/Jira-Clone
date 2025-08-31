/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { ProjectAvatar } from "../../projects/components/project-avatar";
import { Project } from "../../projects/types";
import { useWorkspaceId } from "../../workspaces/hooks/use-workspace-id";
import { ChevronRightIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteTask } from "../api/use-delete-task";
import { useConfirm } from "@/hooks/use-confirm";
import { useRouter } from "next/navigation";
import { Task } from "../types";

interface TaskBreadCrumbsProps {
   project: Project;
   task: Task;
}

export const TaskBreadCrumbs = ({ project, task }: TaskBreadCrumbsProps) => {
   const workspaceId = useWorkspaceId();
   const router = useRouter();
   const {mutate, isPending} = useDeleteTask();
   const [ConfirmDialog, confirm] = useConfirm(
      "Delete Task",
      "This action cannot be undone.",
      "destructive"
   )

   const handleDeleteTask = async () => {
      const ok = await confirm();
      if(!ok) return;

      mutate({param: {taskId: task.$id}}, {
         onSuccess: () => {
            router.push(`/workspaces/${workspaceId}/tasks`)
         }
      })
   }

   return (
      <div className="flex items-center gap-x-2">
         <ConfirmDialog />
         <ProjectAvatar name={project.name} image={project.image} className="size-6 lg:size-8" />
         <Link href={`/workspaces/${workspaceId}/projects/${project.$id}`}>
            <p className="text-sm lg:text-lg font-semibold text-muted-foreground hover:opacity-75 transition">
               {project.name}
            </p>
         </Link>
         <ChevronRightIcon className="size-4 lg:size-5 text-muted-foreground" />
         <p className="text-sm lg:text-lg font-semibold">
            {task.name}
         </p>
         <Button
            className="ml-auto"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleDeleteTask}
         >
            <TrashIcon className="size-4 lg:mr-2" />
            <span className="hidden lg:block">Delete Task</span>
         </Button>
      </div>
   )
}