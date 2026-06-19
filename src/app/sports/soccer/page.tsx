import SportsEventsPage from "@/components/sports/SportsEventsPage";

export default function SoccerPage() {
  return (
    <SportsEventsPage
      title="Soccer"
      eyebrow="Sports"
      description="Find soccer fixtures, then open an event to compare match, goals, qualification, and score markets."
      endpoint="/api/sports/soccer/events"
      showHeroLinks
      showTabs
    />
  );
}
