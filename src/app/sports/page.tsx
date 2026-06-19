import SportsEventsPage from "@/components/sports/SportsEventsPage";

export default function SportsPage() {
  return (
    <SportsEventsPage
      title="Sports Prediction Markets"
      eyebrow="Sports"
      description="Browse sports by event first, then compare the Yes/No markets attached to each match or tournament."
      endpoint="/api/events?category=sports"
      showHeroLinks
      showTabs
    />
  );
}
