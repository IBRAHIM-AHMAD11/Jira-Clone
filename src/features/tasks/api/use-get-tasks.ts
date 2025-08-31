import { useQuery } from "@tanstack/react-query";
import {client} from "@/lib/rpc";
import { TaskStatus } from "../types";

interface useGetTasksProps {
    workspaceId: string;
    projectId?: string | null;
    search?: string | null;
    status?: TaskStatus | null;
    assigneeId?: string | null;
    duedate?: string | null;

}

export const useGetTasks = ({workspaceId, projectId, status, assigneeId, search, duedate}: useGetTasksProps) => {
    const query = useQuery({
        queryKey: [
            "tasks",
            workspaceId,
            projectId,
            status,
            search,
            assigneeId,
            duedate,
        ],
        queryFn: async () => {
            const response = await client.api.tasks.$get({
                query: { 
                    workspaceId,
                    projectId: projectId ?? undefined,
                    status: status ?? undefined,
                    search: search ?? undefined,
                    assigneeId: assigneeId ?? undefined,
                    dueDate: duedate ?? undefined,
                 }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch Tasks")
            }

            const {data} = await response.json();

            return data;
        }
    });

    return query;
}