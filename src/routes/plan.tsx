import { createFileRoute } from "@tanstack/react-router";
import { TimetablePageContent } from "./timetable";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

function PlanPage() {
  return <TimetablePageContent />;
}
