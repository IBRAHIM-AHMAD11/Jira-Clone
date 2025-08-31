"use client";

import { ResponssiveModal } from "@/components/responsive-modal";
import { CreateProjectForm } from "./create-project-form";
import { useCreateProjectModal } from "../hooks/use-create-project-modal";

export const CreateProjectMoadal = () => {

    const {isOpen, setIsOpen, close} = useCreateProjectModal();

    return (
        <ResponssiveModal open={isOpen} onOpenChange={setIsOpen}>
            <CreateProjectForm onCancel={close} />
        </ResponssiveModal>
    );
};