"use client";

import { ResponssiveModal } from "@/components/responsive-modal";
import { EditTaskFormWrapper } from "./create-edit-form-wrapper";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";

export const EditTaskModal = () => {
   const {taskId, close} = useEditTaskModal();

   return (
      <ResponssiveModal open={!!taskId} onOpenChange={close}>
         {taskId && (
            <EditTaskFormWrapper onCancel={close} id={taskId} />
         )}
      </ResponssiveModal>
   )
}