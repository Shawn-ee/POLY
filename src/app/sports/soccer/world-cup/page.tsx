import SportsEventsPage from "@/components/sports/SportsEventsPage";

export default function WorldCupPage() {
  return (
    <SportsEventsPage
      title="World Cup"
      eyebrow="Soccer"
      description="World Cup event markets grouped by match. Use the event page to compare match, goals, qualify, and score markets."
      endpoint="/api/sports/soccer/world-cup/events"
      showTabs
    />
  );
}
