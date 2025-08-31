import { ProjectAnalyticsResponseType } from "@/features/projects/api/use-get-project-analytics";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { AnalyticsCard } from "./analytics-card";
import { DottedSeperator } from "./dotted-sperator";

export const Analytics = ({data}: ProjectAnalyticsResponseType) => {
   return (
      <ScrollArea className="border rounded-lg w-full whitespace-nowrap shrink-0">
         <div className="flex flex-row w-full">
            <div className="flex items-center flex-1">
               <AnalyticsCard title="Total Tasks" value={data.taskCount} variant={data.taskDiffrence > 0 ? "up" : "down"} increaseValue={data.taskDiffrence} />
               <DottedSeperator direction="vertical" />
            </div>

            <div className="flex items-center flex-1">
               <AnalyticsCard title="Assigned Tasks" value={data.assignedTasksCount} variant={data.assignedTaskDiffrence > 0 ? "up" : "down"} increaseValue={data.assignedTaskDiffrence} />
               <DottedSeperator direction="vertical" />
            </div>

            <div className="flex items-center flex-1">
               <AnalyticsCard title="Completed Tasks" value={data.completedTasksCount} variant={data.completedTasksDiffrence > 0 ? "up" : "down"} increaseValue={data.completedTasksDiffrence} />
               <DottedSeperator direction="vertical" />
            </div>

            <div className="flex items-center flex-1">
               <AnalyticsCard title="Overdue Tasks" value={data.overdueTasksCount} variant={data.overdueTasksDiffrence > 0 ? "up" : "down"} increaseValue={data.overdueTasksDiffrence} />
               <DottedSeperator direction="vertical" />
            </div>

            <div className="flex items-center flex-1">
               <AnalyticsCard title="Incomplete Tasks" value={data.incompleteTasksCount} variant={data.incompleteTasksDiffrence > 0 ? "up" : "down"} increaseValue={data.incompleteTasksDiffrence} />
            </div>
         </div>
         <ScrollBar orientation="horizontal" />
      </ScrollArea>
   )
}