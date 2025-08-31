import { Query } from "node-appwrite";
import { DATABASES_ID, MEMEBERS_ID, WORKSPACE_ID } from "@/config";
import { createSessionClient } from "@/lib/appwrite";

export const getWorkspaces = async () => {
  const { account, databases } = await createSessionClient();
  const user = await account.get();

  const members = await databases.listDocuments(DATABASES_ID, MEMEBERS_ID, [
    Query.equal("userId", user.$id),
  ]);

  if (members.total === 0) {
    return { documents: [], total: 0 };
  }

  const workspaceIds = members.documents.map((member) => member.workspaceId);
  const workspaces = await databases.listDocuments(DATABASES_ID, WORKSPACE_ID, [
    Query.orderDesc("$createdAt"),
    Query.contains("$id", workspaceIds),
  ]);

  return workspaces;
};
