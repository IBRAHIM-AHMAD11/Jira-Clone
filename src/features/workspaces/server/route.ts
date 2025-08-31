import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";
import {
  DATABASES_ID,
  IMAGES_BUCKET_ID,
  MEMEBERS_ID,
  TASKS_ID,
  WORKSPACE_ID,
} from "@/config";
import { ID, Query } from "node-appwrite";
import { MemberRole } from "../../members/types";
import { generateInviteCode } from "@/lib/utils";
import { getMember } from "../../members/utils";
import z from "zod";
import { Workspace } from "../types";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { TaskStatus } from "../../tasks/types";

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databses = c.get("databases");
    const members = await databses.listDocuments(DATABASES_ID, MEMEBERS_ID, [
      Query.equal("userId", user.$id),
    ]);

    if (members.total === 0) {
      return c.json({ data: { documents: [], total: 0 } });
    }

    const workspaceIds = members.documents.map((member) => member.workspaceId);
    const workspaces = await databses.listDocuments(
      DATABASES_ID,
      WORKSPACE_ID,
      [Query.orderDesc("$createdAt"), Query.contains("$id", workspaceIds)]
    );

    return c.json({ data: workspaces });
  })
  .post(
    "/",
    zValidator("form", createWorkspaceSchema),
    sessionMiddleware,
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { name, image } = c.req.valid("form");

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image
        );

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          file.$id
        );

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          arrayBuffer
        ).toString("base64")}`;
      }

      const workspace = await databases.createDocument(
        DATABASES_ID,
        WORKSPACE_ID,
        ID.unique(),
        {
          name,
          userId: user.$id,
          image: uploadedImageUrl,
          inviteCode: generateInviteCode(12),
        }
      );

      await databases.createDocument(DATABASES_ID, MEMEBERS_ID, ID.unique(), {
        userId: user.$id,
        workspaceId: workspace.$id,
        role: MemberRole.ADMIN,
      });

      return c.json({ data: workspace });
    }
  )

  .patch(
    "/:workspaceId",
    sessionMiddleware,
    zValidator("form", updateWorkspaceSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { workspaceId } = c.req.param();
      const { name, image } = c.req.valid("form");

      const memeber = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!memeber || memeber.role !== MemberRole.ADMIN) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        const file = await storage.createFile(
          IMAGES_BUCKET_ID,
          ID.unique(),
          image
        );

        const arrayBuffer = await storage.getFilePreview(
          IMAGES_BUCKET_ID,
          file.$id
        );

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          arrayBuffer
        ).toString("base64")}`;
      } else {
        uploadedImageUrl = image;
      }

      const workspace = await databases.updateDocument(
        DATABASES_ID,
        WORKSPACE_ID,
        workspaceId,
        {
          name,
          image: uploadedImageUrl,
        }
      );

      return c.json({ data: workspace });
    }
  )
  .delete("/:workspaceId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId } = c.req.param();
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // TODO: Delete Tasks, Members and Projects

    await databases.deleteDocument(DATABASES_ID, WORKSPACE_ID, workspaceId);

    return c.json({ data: { $id: workspaceId } });
  })

  .get("/:workspaceId", sessionMiddleware, async(c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const {workspaceId} = c.req.param();

    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id
    });
    
    if(!member) return c.json({error: "Unauthorized"}, 401);

    const workspace = await databases.getDocument<Workspace>(
      DATABASES_ID,
      WORKSPACE_ID,
      workspaceId
    );

    return c.json({data: workspace});
  })

  .get("/:workspaceId/info", sessionMiddleware, async(c) => {
    const databases = c.get("databases");
    const {workspaceId} = c.req.param();


    const workspace = await databases.getDocument<Workspace>(
      DATABASES_ID,
      WORKSPACE_ID,
      workspaceId
    );

    return c.json({data: {$id: workspace.$id, name: workspace.name, image: workspace.image}});
  })

  .post("/:workspaceId/reset-invite-code", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { workspaceId } = c.req.param();
    const member = await getMember({
      databases,
      workspaceId,
      userId: user.$id,
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workspace = await databases.updateDocument(
      DATABASES_ID,
      WORKSPACE_ID,
      workspaceId,
      {
        inviteCode: generateInviteCode(12),
      }
    );

    return c.json({ data: workspace });
  })

  .post(
    "/:workspaceId/join",
    sessionMiddleware,
    zValidator("json", z.object({ code: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.param();
      const { code } = c.req.valid("json");
      const databases = c.get("databases");
      const user = c.get("user");
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (member) {
        console.log("User is already a member");
        return c.json({ error: "Already a Member" }, 400);
      }

      const workspace = await databases.getDocument<Workspace>(
        DATABASES_ID,
        WORKSPACE_ID,
        workspaceId
      );

      if (
        workspace.inviteCode.trim().toLowerCase() !== code.trim().toLowerCase()
      ) {
        console.log("code miss")
        return c.json({ error: "Invalid Invite Code" }, 400);
      }

      await databases.createDocument(DATABASES_ID, MEMEBERS_ID, ID.unique(), {
        workspaceId,
        userId: user.$id,
        role: MemberRole.MEMBER,
      });

      return c.json({ data: workspace });
    }
  )

  .get("/:workspaceId/analytics", sessionMiddleware, async(c) => {
      const user = c.get("user");
      const databases = c.get("databases");
  
      const {workspaceId} = c.req.param();

  
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id
      });
  
      if(!member) return c.json({error: "Unauthorized"}, 401);
  
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
  
      const thisMonthTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      );
  
      const lastMonthTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        ]
      );
  
      const taskCount = thisMonthTasks.total;
      const taskDiffrence = taskCount - lastMonthTasks.total;
      
      const thisMonthAssignedTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.equal("assigneeId", member.$id),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      );
  
      const lastMonthAssignedTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.equal("assigneeId", member.$id),
          Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        ]
      );
  
      const assignedTasksCount = thisMonthAssignedTasks.total;
      const assignedTaskDiffrence = assignedTasksCount - lastMonthAssignedTasks.total;
  
      const thisMonthIncompleteTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.notEqual("status", TaskStatus.DONE),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      );
  
      const lastMonthIncompleteTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.notEqual("status", TaskStatus.DONE),
          Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        ]
      );
  
      const incompleteTasksCount = thisMonthIncompleteTasks.total;
      const incompleteTasksDiffrence = incompleteTasksCount - lastMonthIncompleteTasks.total;
  
      const thisMonthCompletedTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.equal("status", TaskStatus.DONE),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      );
  
      const lastMonthCompletedTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.equal("status", TaskStatus.DONE),
          Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        ]
      );
  
      const completedTasksCount = thisMonthCompletedTasks.total;
      const completedTasksDiffrence = completedTasksCount - lastMonthCompletedTasks.total;
  
      const thisMonthOverdueTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.notEqual("status", TaskStatus.DONE),
          Query.lessThan("dueDate", now.toISOString()),
          Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
        ]
      );
  
      const lastMonthOverdueTasks = await databases.listDocuments(
        DATABASES_ID,
        TASKS_ID,
        [
         Query.equal("workspaceId", workspaceId),
          Query.notEqual("status", TaskStatus.DONE),
          Query.lessThan("dueDate", now.toISOString()),
          Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
          Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString()),
        ]
      );
  
      const overdueTasksCount = thisMonthOverdueTasks.total;
      const overdueTasksDiffrence = overdueTasksCount - lastMonthOverdueTasks.total;
  
      return c.json({data: {
        taskCount,
        taskDiffrence,
        assignedTasksCount,
        assignedTaskDiffrence,
        completedTasksCount,
        completedTasksDiffrence,
        incompleteTasksCount,
        incompleteTasksDiffrence,
        overdueTasksCount,
        overdueTasksDiffrence
      }})
    })

export default app;
