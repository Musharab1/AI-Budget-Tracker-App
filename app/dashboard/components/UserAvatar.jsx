// components/UserAvatar.jsx
"use client";
import { useUser } from "@clerk/nextjs";

export default function UserAvatar({ size = "md" }) {
  const { user } = useUser();

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || user.emailAddresses[0].emailAddress[0].toUpperCase()
    : "?";

  return (
    <div className={`relative rounded-full overflow-hidden ${sizes[size]} flex-shrink-0`}>
      {user?.imageUrl ? (
        <img
          src={user.imageUrl}
          alt={user.fullName ?? "User"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center font-semibold bg-emerald-500 text-white ${sizes[size]}`}>
          {initials}
        </div>
      )}
    </div>
  );
}


