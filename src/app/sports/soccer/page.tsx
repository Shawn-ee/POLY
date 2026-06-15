import SportsEventsPage from "@/components/sports/SportsEventsPage";

export default function SoccerPage() {
  return (
    <SportsEventsPage
      title="Soccer"
      eyebrow="Sports"
      description="Soccer events grouped by fixture, with multiple prediction markets under each event."
      endpoint="/api/sports/soccer/events"
      showHeroLinks
      showTabs
    />
  );
}
