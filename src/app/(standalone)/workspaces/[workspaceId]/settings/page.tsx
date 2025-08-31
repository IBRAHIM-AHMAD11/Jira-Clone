import { getCurrent } from "@/features/auth/actions"
import { redirect } from "next/navigation";
import { WorkspaceSettingsPageClient } from "./client";


const WorkspaceSettingsPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <WorkspaceSettingsPageClient />
}

export default WorkspaceSettingsPage