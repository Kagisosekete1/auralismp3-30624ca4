import PlaylistCard from "./PlaylistCard";
import QuickPlayCard from "./QuickPlayCard";

import album1 from "@/assets/album-1.jpg";
import album2 from "@/assets/album-2.jpg";
import album3 from "@/assets/album-3.jpg";
import album4 from "@/assets/album-4.jpg";
import album5 from "@/assets/album-5.jpg";
import album6 from "@/assets/album-6.jpg";

const MainContent = () => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const quickPlayItems = [
    { title: "Liked Songs", image: album1 },
    { title: "Daily Mix 1", image: album2 },
    { title: "Chill Hits", image: album3 },
    { title: "Discover Weekly", image: album4 },
    { title: "Release Radar", image: album5 },
    { title: "Indie Vibes", image: album6 },
  ];

  const madeForYou = [
    {
      title: "Daily Mix 1",
      description: "The Weeknd, Dua Lipa, Post Malone and more",
      image: album1,
    },
    {
      title: "Daily Mix 2",
      description: "Kendrick Lamar, J. Cole, Drake and more",
      image: album2,
    },
    {
      title: "Discover Weekly",
      description: "Your weekly mixtape of fresh music",
      image: album3,
    },
    {
      title: "Release Radar",
      description: "Catch all the latest music from artists you follow",
      image: album4,
    },
    {
      title: "On Repeat",
      description: "Songs you've been playing on repeat",
      image: album5,
    },
    {
      title: "Repeat Rewind",
      description: "Past songs you couldn't stop playing",
      image: album6,
    },
  ];

  const recentlyPlayed = [
    {
      title: "Chill Vibes",
      description: "Lo-fi beats to relax and study to",
      image: album3,
    },
    {
      title: "Workout Pump",
      description: "High energy tracks to fuel your workout",
      image: album2,
    },
    {
      title: "Late Night Jazz",
      description: "Smooth jazz for winding down",
      image: album4,
    },
    {
      title: "Indie Dreams",
      description: "Dreamy indie tracks for your soul",
      image: album6,
    },
    {
      title: "Electronic Focus",
      description: "Deep electronic beats for concentration",
      image: album5,
    },
  ];

  return (
    <main className="flex-1 bg-background overflow-y-auto">
      <div className="gradient-featured">
        <div className="p-6 pb-0">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            {getGreeting()}
          </h1>

          {/* Quick Play Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {quickPlayItems.map((item, index) => (
              <QuickPlayCard
                key={index}
                title={item.title}
                imageUrl={item.image}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Made For You Section */}
      <section className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground hover:underline cursor-pointer">
            Made For You
          </h2>
          <button className="text-sm font-semibold text-muted-foreground hover:underline">
            Show all
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {madeForYou.map((item, index) => (
            <PlaylistCard
              key={index}
              title={item.title}
              description={item.description}
              imageUrl={item.image}
            />
          ))}
        </div>
      </section>

      {/* Recently Played Section */}
      <section className="px-6 py-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground hover:underline cursor-pointer">
            Recently Played
          </h2>
          <button className="text-sm font-semibold text-muted-foreground hover:underline">
            Show all
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {recentlyPlayed.map((item, index) => (
            <PlaylistCard
              key={index}
              title={item.title}
              description={item.description}
              imageUrl={item.image}
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export default MainContent;
