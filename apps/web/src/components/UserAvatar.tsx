import React, { useState } from 'react';
import './UserAvatar.css';

interface AvatarUser {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface UserAvatarProps {
  user?: AvatarUser | null;
  className?: string;
  style?: React.CSSProperties;
}

const getLabel = (user?: AvatarUser | null) =>
  user?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || 'User';

const getInitials = (label: string) => {
  const parts = label.split(/[\s._-]+/).filter(Boolean);
  const initials = parts.slice(0, 2).map(part => part[0]).join('');
  return (initials || label[0] || '?').toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, className = '', style }) => {
  const photoURL = user?.photoURL?.trim() || '';
  const label = getLabel(user);
  const [failedURL, setFailedURL] = useState<string | null>(null);
  const failed = failedURL === photoURL;

  return (
    <span
      className={`user-avatar ${className}`.trim()}
      style={style}
      role="img"
      aria-label={label}
      title={label}
    >
      {photoURL && !failed ? (
        <img
          src={photoURL}
          alt=""
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          onError={() => setFailedURL(photoURL)}
        />
      ) : (
        <span className="user-avatar-initials" aria-hidden="true">
          {getInitials(label)}
        </span>
      )}
    </span>
  );
};
