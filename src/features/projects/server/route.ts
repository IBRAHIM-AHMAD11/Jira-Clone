import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import z from "zod";
import { getMember } from "../../members/utils";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import {
  DATABASES_ID,
  IMAGES_BUCKET_ID,
  PROJECTS_ID,
  TASKS_ID,
} from "@/config";
import { ID, Query } from "node-appwrite";
import { createProjectSchema, updateProjectSchema } from "../schema";
import { Project } from "../types";
import { TaskStatus } from "../../tasks/types";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = c.get("user");
      const databases = c.get("databases");
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const projects = await databases.listDocuments<Project>(
        DATABASES_ID,
        PROJECTS_ID,
        [Query.equal("workspaceId", workspaceId), Query.orderDesc("$createdAt")]
      );

      return c.json({ data: projects });
    }
  )

  .post(
    "/",
    sessionMiddleware,
    zValidator("form", createProjectSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { name, image, workspaceId } = c.req.valid("form");
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) return c.json({ error: "Unauthorized" }, 401);
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

      const project = await databases.createDocument<Project>(
        DATABASES_ID,
        PROJECTS_ID,
        ID.unique(),
        {
          name,
          image: uploadedImageUrl,
          workspaceId,
        }
      );

      return c.json({ data: project });
    }
  )

  .patch(
    "/:projectId",
    sessionMiddleware,
    zValidator("form", updateProjectSchema),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const user = c.get("user");

      const { projectId } = c.req.param();
      const { name, image } = c.req.valid("form");

      const existingProject = await databases.getDocument<Project>(
        DATABASES_ID,
        PROJECTS_ID,
        projectId
      );

      const memeber = await getMember({
        databases,
        workspaceId: existingProject.workspaceId,
        userId: user.$id,
      });

      if (!memeber) {
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

      const project = await databases.updateDocument<Project>(
        DATABASES_ID,
        PROJECTS_ID,
        projectId,
        {
          name,
          image: uploadedImageUrl,
        }
      );

      return c.json({ data: project });
    }
  )

  .delete("/:projectId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");
    const { projectId } = c.req.param();
    const existingProject = await databases.getDocument<Project>(
        DATABASES_ID,
        PROJECTS_ID,
        projectId
      );
    const member = await getMember({
      databases,
      workspaceId: existingProject.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // TODO: Delete Tasks

    await databases.deleteDocument(DATABASES_ID, PROJECTS_ID, projectId);

    return c.json({ data: { $id: projectId } });
  })

  .get("/:projectId", sessionMiddleware, async (c) => {
    const user = c.get("user");
    const databases = c.get("databases");
    const {projectId} = c.req.param();

    const project = await databases.getDocument<Project>(
      DATABASES_ID,
      PROJECTS_ID,
      projectId
    );

    const member = await getMember({
      databases,
      workspaceId: project.workspaceId,
      userId: user.$id,
    });

    if(!member) return c.json({error: "Unauthorized"}, 401);

    return c.json({data: project});
  })

  .get("/:projectId/analytics", sessionMiddleware, async(c) => {
    const user = c.get("user");
    const databases = c.get("databases");

    const {projectId} = c.req.param();
    const project = await databases.getDocument<Project>(
      DATABASES_ID,
      PROJECTS_ID,
      projectId
    );

    const member = await getMember({
      databases,
      workspaceId: project.workspaceId,
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
        Query.equal("projectId", projectId),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthTasks = await databases.listDocuments(
      DATABASES_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
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
        Query.equal("projectId", projectId),
        Query.equal("assigneeId", member.$id),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthAssignedTasks = await databases.listDocuments(
      DATABASES_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
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
        Query.equal("projectId", projectId),
        Query.notEqual("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthIncompleteTasks = await databases.listDocuments(
      DATABASES_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
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
        Query.equal("projectId", projectId),
        Query.equal("status", TaskStatus.DONE),
        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString()),
      ]
    );

    const lastMonthCompletedTasks = await databases.listDocuments(
      DATABASES_ID,
      TASKS_ID,
      [
        Query.equal("projectId", projectId),
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
        Query.equal("projectId", projectId),
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
        Query.equal("projectId", projectId),
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
