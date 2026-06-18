import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RiUserFollowLine,
  RiUserUnfollowLine,
  RiMessage3Line,
  RiMapPinLine,
  RiLinkM,
  RiCalendarLine,
  RiSettings4Line,
  RiImageEditLine,
  RiCloseLine,
  RiCheckLine,
  RiMoreLine,
  RiShareLine,
  RiUserLine,
  RiLoader4Line,
} from "react-icons/ri";
import { selectUser, updateProfile } from "@/features/auth/authSlice";
import { userApi, postApi, chatApi } from "@/services/api";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { openLogoutModal } from '@/features/ui/uiSlice';
import PostCard from "@/components/common/PostCard";
import PostSkeleton from "@/components/loaders/PostSkeleton";
import UserCard from "@/components/common/UserCard";
import UserSkeleton from "@/components/loaders/UserSkeleton";
import { profileSchema } from "@/validations";
import {
  getAvatarUrl,
  formatCount,
  formatDate,
  cn,
  copyToClipboard,
} from "@/utils";
import toast from "react-hot-toast";


const TABS = ["Posts", "Followers", "Following"];

/* ─────────────────────────────────────────────────────────── */
export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const me = useSelector(selectUser);

  const [tab, setTab] = useState("Posts");
  const [isFollowing, setIsFollowing] = useState(null);
  const [fLoading, setFLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  /* fetch profile */
  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => userApi.getProfile(username).then((r) => r.data.data),
    onSuccess: (d) => {
      if (isFollowing === null) setIsFollowing(d.isFollowing);
    },
  });

  const isOwn = me?._id === profile?._id || me?.username === username;
  const following = isFollowing ?? profile?.isFollowing ?? false;

  /* posts */
  const {
    items: posts,
    isLoading: postsLoading,
    loaderRef,
  } = useInfiniteScroll({
    queryKey: ["userPosts", username],
    queryFn: ({ page, limit }) =>
      postApi.getUserPosts(username, { page, limit }).then((r) => r.data),
    enabled: tab === "Posts",
  });

  /* followers list */
  const { data: followers, isLoading: flrLoad } = useQuery({
    queryKey: ["followers", username],
    queryFn: () =>
      userApi.getFollowers(username, { limit: 50 }).then((r) => r.data.data),
    enabled: tab === "Followers",
  });

  /* following list */
  const { data: followingList, isLoading: flwLoad } = useQuery({
    queryKey: ["following", username],
    queryFn: () =>
      userApi.getFollowing(username, { limit: 50 }).then((r) => r.data.data),
    enabled: tab === "Following",
  });

  /* follow / unfollow */
  const handleFollow = async () => {
    if (!me) return navigate("/login");
    setFLoading(true);
    const was = following;
    setIsFollowing(!was);
    try {
      await userApi.follow(profile._id);
      qc.invalidateQueries({ queryKey: ["profile", username] });
      if (!was) toast.success(`Following @${profile.username}!`);
    } catch {
      setIsFollowing(was);
      toast.error("Action failed");
    } finally {
      setFLoading(false);
    }
  };

  /* message */
  const handleMessage = async () => {
    try {
      const { data } = await chatApi.getDMConversation(profile._id);
      navigate(`/chat/${data.data._id}`);
    } catch {
      toast.error("Could not open conversation");
    }
  };

  /* share */
  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${username}`;
    if (await copyToClipboard(url)) toast.success("Profile link copied!");
  };

  /* ── loading skeleton ── */
  if (pLoading) return <ProfileSkeleton />;

  /* ── not found ── */
  if (!profile)
    return (
      <div className="card p-12 text-center">
        <RiUserLine size={40} className="mx-auto mb-3 text-muted opacity-40" />
        <p className="font-semibold text-secondary mb-4">User not found</p>
        <button onClick={() => navigate(-1)} className="btn-secondary btn">
          Go back
        </button>
      </div>
    );

  return (
    <>
      <Helmet>
        <title>{`${profile.name || profile.username} (@${profile.username}) · Nexus`}</title>
        <meta
          name="description"
          content={profile.bio || `@${profile.username} on Nexus`}
        />
      </Helmet>

      {/* ── Edit Profile Modal ── */}
      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSaved={() => {
          setEditOpen(false);
          qc.invalidateQueries({ queryKey: ["profile", username] });
        }}
      />

      {/* ── Cover ── */}
      <div className="relative rounded-2xl overflow-hidden h-40 sm:h-52 bg-gradient-to-br from-brand-300/40 via-purple-400/20 to-blue-400/20">
        {profile.coverImage?.url && (
          <img
            src={profile.coverImage.url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        {isOwn && (
          <button
            onClick={() => setEditOpen(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/70 text-white text-xs font-medium backdrop-blur-sm transition-all"
          >
            <RiImageEditLine size={14} /> Edit cover
          </button>
        )}
      </div>

      {/* ── Profile card ── */}
      <div className="card -mt-6 pt-0 pb-5 px-5 mb-4">
        {/* avatar row */}
        <div className="flex items-end justify-between pb-4">
          <div className="-mt-12 relative">
            <Avatar
              src={getAvatarUrl(profile)}
              alt={profile.username}
              size={96}
              online={profile.onlineStatus === "online"}
              className="ring-4 ring-white dark:ring-gray-900"
            />
            {isOwn && (
              <button
                onClick={() => setEditOpen(true)}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand border-2 border-white dark:border-gray-900 flex items-center justify-center text-white hover:bg-brand/80 transition-colors"
              >
                <RiImageEditLine size={13} />
              </button>
            )}
          </div>

          {/* action buttons */}
          <div className="flex items-center gap-2 pt-4 flex-wrap justify-end">
            {/* {isOwn ? (
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <RiSettings4Line size={15} /> Edit profile
              </Button>
            )  */}
            {isOwn ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <RiSettings4Line size={15} /> Edit profile
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => dispatch(openLogoutModal())}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <motion.button
                  onClick={handleFollow}
                  disabled={fLoading}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "btn text-sm py-2 px-4 font-semibold rounded-xl transition-all",
                    following
                      ? "btn-secondary"
                      : "bg-brand text-white hover:bg-brand/90 shadow-md shadow-brand/25",
                  )}
                >
                  {fLoading ? (
                    <RiLoader4Line size={16} className="animate-spin" />
                  ) : following ? (
                    <>
                      <RiUserUnfollowLine size={15} /> Unfollow
                    </>
                  ) : (
                    <>
                      <RiUserFollowLine size={15} /> Follow
                    </>
                  )}
                </motion.button>
                <Button variant="secondary" size="sm" onClick={handleMessage}>
                  <RiMessage3Line size={15} /> Message
                </Button>
              </>
            )}
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-base hover:bg-base-3 text-muted hover:text-primary transition-colors"
              title="Share profile"
            >
              <RiShareLine size={16} />
            </button>
          </div>
        </div>

        {/* name & username */}
        <div className="mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">
              {profile.name || profile.username}
            </h1>
            {profile.isVerified && (
              <span title="Verified account">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-brand"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            )}
            {profile.role !== "user" && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 capitalize">
                {profile.role}
              </span>
            )}
          </div>
          <p className="text-muted text-sm mt-0.5">@{profile.username}</p>
        </div>

        {/* bio */}
        {profile.bio && (
          <p className="text-sm leading-relaxed mb-3 text-secondary">
            {profile.bio}
          </p>
        )}

        {/* meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-sm text-muted">
          {profile.location && (
            <span className="flex items-center gap-1.5">
              <RiMapPinLine size={14} className="text-brand" />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-brand hover:underline"
            >
              <RiLinkM size={14} />
              {profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {profile.createdAt && (
            <span className="flex items-center gap-1.5">
              <RiCalendarLine size={14} />
              Joined {formatDate(profile.createdAt, "MMMM yyyy")}
            </span>
          )}
        </div>

        {/* stats */}
        <div className="flex gap-5 text-sm border-t border-base pt-4">
          <button
            onClick={() => setTab("Posts")}
            className={cn(
              "transition-colors",
              tab === "Posts" ? "text-brand font-semibold" : "hover:text-brand",
            )}
          >
            <strong>{formatCount(profile.postsCount)}</strong>
            <span className="text-muted ml-1">Posts</span>
          </button>
          <button
            onClick={() => setTab("Followers")}
            className={cn(
              "transition-colors",
              tab === "Followers"
                ? "text-brand font-semibold"
                : "hover:text-brand",
            )}
          >
            <strong>{formatCount(profile.followersCount)}</strong>
            <span className="text-muted ml-1">Followers</span>
          </button>
          <button
            onClick={() => setTab("Following")}
            className={cn(
              "transition-colors",
              tab === "Following"
                ? "text-brand font-semibold"
                : "hover:text-brand",
            )}
          >
            <strong>{formatCount(profile.followingCount)}</strong>
            <span className="text-muted ml-1">Following</span>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-base-2 border border-base rounded-xl mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
              tab === t
                ? "bg-base text-primary shadow-sm"
                : "text-muted hover:text-primary",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Posts */}
          {tab === "Posts" && (
            <div className="space-y-4">
              {postsLoading && <PostSkeleton count={3} />}
              {!postsLoading && posts.length === 0 && (
                <div className="card p-12 text-center">
                  <p className="text-secondary text-sm">
                    {isOwn
                      ? "You haven't posted yet."
                      : `@${profile.username} hasn't posted yet.`}
                  </p>
                </div>
              )}
              {posts.map((p) => (
                <PostCard
                  key={p._id}
                  post={p}
                  queryKey={["userPosts", username]}
                />
              ))}
              <div ref={loaderRef} />
            </div>
          )}

          {/* Followers */}
          {tab === "Followers" && (
            <div className="card divide-y divide-base overflow-hidden">
              {flrLoad && <UserSkeleton count={5} />}
              {!flrLoad && followers?.length === 0 && (
                <p className="text-center text-secondary text-sm py-12">
                  No followers yet.
                </p>
              )}
              {followers?.map((u) => (
                <UserCard key={u._id} user={u} />
              ))}
            </div>
          )}

          {/* Following */}
          {tab === "Following" && (
            <div className="card divide-y divide-base overflow-hidden">
              {flwLoad && <UserSkeleton count={5} />}
              {!flwLoad && followingList?.length === 0 && (
                <p className="text-center text-secondary text-sm py-12">
                  Not following anyone yet.
                </p>
              )}
              {followingList?.map((u) => (
                <UserCard key={u._id} user={u} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

/* ─── Edit Profile Modal ────────────────────────────────────── */
function EditProfileModal({ isOpen, onClose, profile, onSaved }) {
  const dispatch = useDispatch();
  const avatarRef = useRef(null);
  const coverRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      bio: profile?.bio || "",
      website: profile?.website || "",
      location: profile?.location || "",
    },
  });

  const bioValue = watch("bio", profile?.bio || "");

  const pickAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    const r = new FileReader();
    r.onload = (ev) => setAvatarPreview(ev.target.result);
    r.readAsDataURL(f);
  };

  const pickCover = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    const r = new FileReader();
    r.onload = (ev) => setCoverPreview(ev.target.result);
    r.readAsDataURL(f);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      // Append text fields
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== "") fd.append(k, v);
      });
      // Append files with correct field names matching the server
      if (avatarFile) fd.append("avatar", avatarFile);
      if (coverFile) fd.append("coverImage", coverFile); // ← was missing

      const result = await dispatch(updateProfile(fd));
      if (updateProfile.fulfilled.match(result)) {
        toast.success("Profile updated!");
        onSaved();
      } else {
        toast.error(result.payload || "Update failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setCoverPreview(null);
    setCoverFile(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", damping: 28, stiffness: 360 }}
            className="relative z-10 w-full max-w-lg bg-base border border-base rounded-2xl shadow-2xl overflow-hidden max-h-[90svh] flex flex-col"
          >
            {/* header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-base flex-shrink-0">
              <h2 className="font-bold text-lg">Edit profile</h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-base-3 text-muted"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* scrollable body */}
            <div className="overflow-y-auto flex-1">
              {/* cover photo */}
              <div className="relative h-32 bg-gradient-to-br from-brand/30 to-purple-400/20 overflow-hidden">
                {(coverPreview || profile?.coverImage?.url) && (
                  <img
                    src={coverPreview || profile.coverImage.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 hover:bg-black/50 text-white text-sm font-medium transition-all"
                >
                  <RiImageEditLine size={18} /> Change cover
                </button>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  onChange={pickCover}
                  className="hidden"
                />
              </div>

              <div className="px-5 pb-5">
                {/* avatar edit */}
                <div className="flex items-end gap-4 -mt-10 mb-5">
                  <div className="relative">
                    <Avatar
                      src={avatarPreview || getAvatarUrl(profile)}
                      alt={profile?.username}
                      size={80}
                      className="ring-4 ring-white dark:ring-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => avatarRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand border-2 border-white dark:border-gray-900 flex items-center justify-center text-white hover:bg-brand/80 transition-colors"
                    >
                      <RiImageEditLine size={14} />
                    </button>
                    <input
                      ref={avatarRef}
                      type="file"
                      accept="image/*"
                      onChange={pickAvatar}
                      className="hidden"
                    />
                  </div>
                  <div className="pb-1">
                    <p className="font-semibold text-sm">
                      {profile?.name || profile?.username}
                    </p>
                    <p className="text-xs text-muted">@{profile?.username}</p>
                  </div>
                </div>

                <form
                  id="editProfileForm"
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <Input
                    label="Display name"
                    placeholder="Your full name"
                    error={errors.name?.message}
                    {...register("name")}
                  />

                  <div>
                    <label className="text-sm font-medium text-primary block mb-1.5">
                      Bio
                      <span className="ml-1 text-muted font-normal">
                        ({bioValue.length}/160)
                      </span>
                    </label>
                    <textarea
                      placeholder="Tell the world about yourself…"
                      maxLength={160}
                      rows={3}
                      className={cn(
                        "input-base resize-none",
                        errors.bio && "border-red-500",
                      )}
                      {...register("bio")}
                    />
                    {errors.bio && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>

                  <Input
                    label="Website"
                    type="url"
                    placeholder="https://yoursite.com"
                    error={errors.website?.message}
                    {...register("website")}
                  />

                  <Input
                    label="Location"
                    placeholder="City, Country"
                    error={errors.location?.message}
                    {...register("location")}
                  />
                </form>
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-base flex-shrink-0">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="editProfileForm"
                loading={saving}
                disabled={!isDirty && !avatarFile && !coverFile}
              >
                <RiCheckLine size={16} /> Save changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─── Profile skeleton ──────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="skeleton h-52 w-full rounded-2xl" />
      <div className="card -mt-6 p-5 space-y-4">
        <div className="flex justify-between items-end">
          <div className="skeleton w-24 h-24 rounded-full -mt-12 ring-4 ring-white" />
          <div className="skeleton h-9 w-28 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-3.5 w-24 rounded" />
          <div className="skeleton h-3.5 w-full rounded" />
          <div className="skeleton h-3.5 w-3/4 rounded" />
        </div>
        <div className="flex gap-6 pt-2">
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}
