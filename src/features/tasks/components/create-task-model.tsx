"use client";

import { ResponssiveModal } from "@/components/responsive-modal";
import { useCreateTaskModal } from "../hooks/use-create-task-modal";
import { CreateTaskFormWrapper } from "./create-task-form-wrapper";

export const CreateTaskModal = () => {
   const {isOpen, setIsOpen, close} = useCreateTaskModal();

   return (
      <ResponssiveModal open={isOpen} onOpenChange={setIsOpen}>
         <CreateTaskFormWrapper onCancel={close} />
      </ResponssiveModal>
   )
}