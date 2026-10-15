import React from 'react';

interface AvatarProps {
  name: string;
  lastName?: string;
  photoUrl?: string | null;
  size?: number; // default 48px
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  lastName = '',
  photoUrl,
  size = 48,
  className = '',
}) => {
  const firstLetter = name ? name.trim().charAt(0).toUpperCase() : 'U';
  const secondLetter = lastName ? lastName.trim().charAt(0).toUpperCase() : '';

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`rounded-full bg-[#1A1033] text-[#E4FF4D] font-bold text-sm flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs select-none ${className}`}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`${name} ${lastName}`.trim()}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>
          {firstLetter}
          {secondLetter}
        </span>
      )}
    </div>
  );
};
