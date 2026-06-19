import SportsEventsPage from "@/components/sports/SportsEventsPage";

export default function WorldCupPage() {
  return (
    <SportsEventsPage
      title="World Cup"
      eyebrow="Soccer"
      description="World Cup markets grouped by match. Open an event to compare the available Yes/No questions before trading."
      endpoint="/api/sports/soccer/world-cup/events"
      showTabs
    />
  );
}
