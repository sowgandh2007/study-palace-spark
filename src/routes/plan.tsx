import { createFileRoute, redirect } from "@tanstack/react-router";
import { TimetablePageContent } from "./timetable";

export const Route = createFileRoute("/plan")({
  beforeLoad: () => {
    throw redirect({ to: "/timetable" });
  },
  component: PlanPage,
});

function PlanPage() {
  return <TimetablePageContent />;
}
