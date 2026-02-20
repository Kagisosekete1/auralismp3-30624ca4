import { BadgeCheck } from "lucide-react";

const VERIFIED_EMAILS = ["kagisosekete5@gmail.com"];

interface VerifiedBadgeProps {
  email?: string | null;
  className?: string;
}

const VerifiedBadge = ({ email, className = "" }: VerifiedBadgeProps) => {
  if (!email || !VERIFIED_EMAILS.includes(email)) return null;
  return (
    <BadgeCheck className={`w-4 h-4 text-blue-500 inline-flex flex-shrink-0 ${className}`} />
  );
};

export default VerifiedBadge;
