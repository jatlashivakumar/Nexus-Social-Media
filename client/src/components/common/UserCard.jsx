import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/authSlice';
import { userApi } from '@/services/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { getAvatarUrl, formatCount } from '@/utils';

export default function UserCard({ user, showFollow = true }) {
  const me = useSelector(selectUser);
  const [following, setFollowing] = useState(user.isFollowing || false);
  const [loading,   setLoading]   = useState(false);
  const isOwn = me?._id === user._id;

  const handleFollow = async (e) => {
    e.preventDefault(); setLoading(true);
    const was = following; setFollowing(!was);
    try { await userApi.follow(user._id); } catch { setFollowing(was); }
    setLoading(false);
  };

  return (
    <Link to={`/profile/${user.username}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-3 transition-colors group">
      <Avatar src={getAvatarUrl(user)} alt={user.username} size={44} online={user.onlineStatus==='online'} className="flex-shrink-0"/>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-semibold text-sm truncate group-hover:text-brand transition-colors">{user.name||user.username}</p>
          {user.isVerified && <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-brand flex-shrink-0"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        </div>
        <p className="text-xs text-muted truncate">@{user.username}</p>
        {user.followersCount !== undefined && <p className="text-xs text-muted mt-0.5">{formatCount(user.followersCount)} followers</p>}
      </div>
      {showFollow && !isOwn && (
        <Button variant={following ? 'secondary' : 'primary'} size="sm" loading={loading} onClick={handleFollow} className="flex-shrink-0">
          {following ? 'Following' : 'Follow'}
        </Button>
      )}
    </Link>
  );
}
