import { useState } from 'react';

const DefaultAvatar = ({ name, profilePicture }) => {
  const [hasError, setHasError] = useState(false);
  const hasValidImage = !hasError && profilePicture && typeof profilePicture === 'string' && profilePicture.trim() !== '' && (profilePicture.startsWith('http') || profilePicture.startsWith('data:'));

  if (hasValidImage) {
    return (
      <div className="h-full w-full relative">
        <img
          src={profilePicture}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="h-full w-full bg-gradient-to-br from-primary-500 to-navy-600 flex items-center justify-center">
      <span className="text-2xl font-bold text-white">{initial}</span>
    </div>
  );
};

export default DefaultAvatar; 