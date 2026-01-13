import { Play } from "lucide-react";

interface QuickPlayCardProps {
  title: string;
  imageUrl: string;
  onClick?: () => void;
}

const QuickPlayCard = ({ title, imageUrl, onClick }: QuickPlayCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group flex items-center bg-surface-elevated/60 hover:bg-surface-highlight rounded-md overflow-hidden transition-colors"
    >
      <img
        src={imageUrl}
        alt={title}
        className="w-12 h-12 object-cover shadow-md"
      />
      <span className="flex-1 px-4 font-semibold text-sm text-foreground truncate text-left">
        {title}
      </span>
      <div className="opacity-0 group-hover:opacity-100 pr-2 transition-opacity">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center play-button-shadow hover:scale-105 transition-transform">
          <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
        </div>
      </div>
    </button>
  );
};

export default QuickPlayCard;
