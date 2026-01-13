import { Play } from "lucide-react";

interface PlaylistCardProps {
  title: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
}

const PlaylistCard = ({ title, description, imageUrl, onClick }: PlaylistCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group bg-card hover:bg-card-hover p-4 rounded-lg transition-all duration-300 text-left w-full"
    >
      <div className="relative mb-4">
        <img
          src={imageUrl}
          alt={title}
          className="w-full aspect-square object-cover rounded-md shadow-lg"
        />
        <div className="absolute bottom-2 right-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center play-button-shadow hover:scale-105 hover:bg-spotify-green-hover transition-transform">
            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </button>
        </div>
      </div>
      <h3 className="font-bold text-foreground mb-1 truncate">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
    </button>
  );
};

export default PlaylistCard;
