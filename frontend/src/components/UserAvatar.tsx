const PALETTE = [
  'from-blue-500 to-cyan-400',
  'from-indigo-500 to-blue-400',
  'from-violet-500 to-indigo-400',
  'from-cyan-500 to-teal-400',
  'from-sky-500 to-blue-400',
  'from-indigo-500 to-violet-400',
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

interface UserAvatarProps {
  name: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, size = 32, className = '' }: UserAvatarProps) {
  const initial = name && name.trim() ? name.trim()[0].toUpperCase() : '?';
  const key = name && name.trim() ? name.trim() : 'unknown';
  const gradient = PALETTE[hashString(key) % PALETTE.length];

  return (
    <div
      className={`grid place-items-center rounded-full bg-gradient-to-br ${gradient} text-white font-semibold shrink-0 shadow-lg select-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.floor(size * 0.42) }}
      title={name && name.trim() ? name : 'Guest'}
    >
      {initial}
    </div>
  );
}
