import SportsEventsPage from "@/components/sports/SportsEventsPage";

export default function SportsPage() {
  return (
    <SportsEventsPage
      title="Sports Prediction Markets"
      eyebrow="Sports"
      description="Browse sports events, then trade event markets such as match winner, totals, both teams to score, qualification, and score lines."
      endpoint="/api/events?category=sports"
      showHeroLinks
      showTabs
    />
  );
}
