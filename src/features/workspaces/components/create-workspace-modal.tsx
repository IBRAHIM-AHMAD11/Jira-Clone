"use client";

import { ResponssiveModal } from "@/components/responsive-modal";
import { CreateWorkspaceForm } from "./create-workspace-form";
import { useCreateWorkspaceModal } from "../hooks/use-create-workspace-modal";

export const CreateWorkspaceMoadal = () => {

    const {isOpen, setIsOpen, close} = useCreateWorkspaceModal();

    return (
        <ResponssiveModal open={isOpen} onOpenChange={setIsOpen}>
            <CreateWorkspaceForm onCancel={close} />
        </ResponssiveModal>
    );
};