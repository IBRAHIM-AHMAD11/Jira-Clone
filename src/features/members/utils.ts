import { DATABASES_ID, MEMEBERS_ID } from "@/config";
import { Query, type Databases } from "node-appwrite";

interface getMemberProps {
    databases: Databases;
    workspaceId: string;
    userId: string;
}

export const getMember = async ({databases, workspaceId, userId}: getMemberProps) => {
    const members = await databases.listDocuments(
        DATABASES_ID,
        MEMEBERS_ID,
        [
            Query.equal("workspaceId", workspaceId),
            Query.equal("userId", userId),
        ],
    );

    return members.documents[0];
};