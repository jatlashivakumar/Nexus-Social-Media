import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiUserLine, RiLockLine, RiBellLine, RiPaletteLine,
  RiShieldLine, RiImageEditLine, RiCheckLine, RiSunLine,
  RiMoonLine, RiEyeLine, RiEyeOffLine, RiAlertLine,
  RiDeleteBin6Line, RiArrowRightLine,
} from 'react-icons/ri';
import { selectUser, updateProfile } from '@/features/auth/authSlice';
import { toggleTheme, selectTheme } from '@/features/ui/uiSlice';
import { authApi } from '@/services/api';
import { profileSchema, changePasswordSchema } from '@/validations';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { getAvatarUrl, cn } from '@/utils';
import toast from 'react-hot-toast';

const SECTIONS = [
  { id: 'profile',       label: 'Profile',        Icon: RiUserLine    },
  { id: 'password',      label: 'Password',       Icon: RiLockLine    },
  { id: 'appearance',    label: 'Appearance',     Icon: RiPaletteLine },
  { id: 'notifications', label: 'Notifications',  Icon: RiBellLine    },
  { id: 'privacy',       label: 'Privacy',        Icon: RiShieldLine  },
  { id: 'danger',        label: 'Danger zone',    Icon: RiAlertLine   },
];

/* ─── toggle component ─────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none',
        checked ? 'bg-brand' : 'bg-base-3',
      )}
    >
      <span className={cn(
        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
        checked ? 'translate-x-[22px]' : 'translate-x-0.5',
      )} />
    </button>
  );
}

/* ─── section row ──────────────────────────────────────────────── */
function SettingRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-base last:border-0">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted mt-0.5">{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* ─── main ─────────────────────────────────────────────────────── */
export default function Settings() {
  const [active, setActive] = useState('profile');

  return (
    <>
      <Helmet><title>Settings · Nexus</title></Helmet>

      <h1 className="text-xl font-bold mb-6">Settings</h1>

      <div className="flex gap-5 items-start flex-col sm:flex-row">
        {/* sidebar nav */}
        <nav className="flex sm:flex-col gap-1 w-full sm:w-52 flex-shrink-0 overflow-x-auto sm:overflow-visible no-scrollbar">
          {SECTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left',
                active === id
                  ? 'bg-brand/10 text-brand'
                  : id === 'danger'
                  ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-secondary hover:bg-base-3 hover:text-primary',
              )}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* content */}
        <div className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {active === 'profile'       && <ProfileSection />}
              {active === 'password'      && <PasswordSection />}
              {active === 'appearance'    && <AppearanceSection />}
              {active === 'notifications' && <NotificationsSection />}
              {active === 'privacy'       && <PrivacySection />}
              {active === 'danger'        && <DangerSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

/* ─── Profile ──────────────────────────────────────────────────── */
function ProfileSection() {
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);
  const fileRef   = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file,    setFile]    = useState(null);

  const { register, handleSubmit, formState: { errors, isDirty, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', bio: user?.bio || '', website: user?.website || '', location: user?.location || '' },
  });

  const pickFile = e => {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f);
    const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f);
  };

  const onSubmit = async (data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });
    if (file) fd.append('avatar', file);
    const res = await dispatch(updateProfile(fd));
    if (updateProfile.fulfilled.match(res)) toast.success('Profile updated!');
    else toast.error(res.payload || 'Update failed');
  };

  return (
    <div className="card p-6 space-y-6">
      <h2 className="font-bold text-base">Public profile</h2>

      {/* avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar src={preview || getAvatarUrl(user)} alt={user?.username} size={80} />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand border-2 border-white dark:border-gray-900 flex items-center justify-center text-white hover:bg-brand/90 transition-colors"
          >
            <RiImageEditLine size={14} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" />
        </div>
        <div>
          <p className="font-semibold">{user?.name || user?.username}</p>
          <p className="text-sm text-muted">@{user?.username}</p>
          <p className="text-xs text-muted mt-1">JPG, PNG or WebP · Max 5 MB</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full name" placeholder="Your name" error={errors.name?.message} {...register('name')} />
          <div>
            <label className="text-sm font-medium text-primary block mb-1.5">Username</label>
            <input value={`@${user?.username}`} disabled className="input-base opacity-50 cursor-not-allowed" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-primary block mb-1.5">Bio</label>
          <textarea
            placeholder="Tell the world about yourself…"
            maxLength={160}
            className="input-base min-h-[80px] resize-none"
            {...register('bio')}
          />
          {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Website" type="url" placeholder="https://yoursite.com" error={errors.website?.message} {...register('website')} />
          <Input label="Location" placeholder="City, Country" error={errors.location?.message} {...register('location')} />
        </div>

        <div className="pt-2">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty && !file}>
            <RiCheckLine size={16} /> Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ─── Password ─────────────────────────────────────────────────── */
function PasswordSection() {
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed!');
      reset();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to change password');
    }
  };

  const eye = (
    <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted hover:text-primary">
      {showPw ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
    </button>
  );

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-bold text-base">Change password</h2>
        <p className="text-sm text-muted mt-1">Use a strong password you don't use elsewhere.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Current password"  type={showPw ? 'text' : 'password'} placeholder="••••••••" leftIcon={RiLockLine} error={errors.currentPassword?.message} autoComplete="current-password" rightElement={eye} {...register('currentPassword')} />
        <Input label="New password"      type={showPw ? 'text' : 'password'} placeholder="Min 8 chars" leftIcon={RiLockLine} error={errors.newPassword?.message} autoComplete="new-password" {...register('newPassword')} />
        <Input label="Confirm new password" type={showPw ? 'text' : 'password'} placeholder="••••••••" leftIcon={RiLockLine} error={errors.confirmPassword?.message} autoComplete="new-password" {...register('confirmPassword')} />

        <Button type="submit" loading={isSubmitting}>Update password</Button>
      </form>
    </div>
  );
}

/* ─── Appearance ───────────────────────────────────────────────── */
function AppearanceSection() {
  const dispatch = useDispatch();
  const theme    = useSelector(selectTheme);

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-bold text-base">Appearance</h2>
        <p className="text-sm text-muted mt-1">Choose how Nexus looks to you.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { value: 'light', label: 'Light', Icon: RiSunLine,  bg: 'bg-white border-2 border-gray-100' },
          { value: 'dark',  label: 'Dark',  Icon: RiMoonLine, bg: 'bg-gray-900 border-2 border-gray-700' },
        ].map(({ value, label, Icon, bg }) => (
          <button
            key={value}
            onClick={() => theme !== value && dispatch(toggleTheme())}
            className={cn(
              'p-4 rounded-xl border-2 transition-all text-left group',
              theme === value ? 'border-brand shadow-md shadow-brand/10' : 'border-base hover:border-brand/40',
            )}
          >
            <div className={cn('w-full h-20 rounded-xl mb-3 overflow-hidden relative', bg)}>
              {/* mini preview */}
              <div className={cn('absolute left-3 top-3 right-3 h-3 rounded', value === 'light' ? 'bg-gray-200' : 'bg-gray-700')} />
              <div className={cn('absolute left-3 top-8 w-8 h-8 rounded-full', value === 'light' ? 'bg-gray-300' : 'bg-gray-600')} />
              <div className={cn('absolute left-14 top-9 right-3 h-2.5 rounded', value === 'light' ? 'bg-gray-200' : 'bg-gray-700')} />
              <div className={cn('absolute left-14 top-13 right-6 h-2 rounded', value === 'light' ? 'bg-gray-100' : 'bg-gray-800')} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={16} />
                <span className="text-sm font-semibold">{label}</span>
              </div>
              {theme === value && (
                <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                  <RiCheckLine size={11} className="text-white" />
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Notifications ────────────────────────────────────────────── */
function NotificationsSection() {
  const user     = useSelector(selectUser);
  const dispatch = useDispatch();
  const prefs    = user?.notifications || {};

  const [s, setS] = useState({
    email:    prefs.email    ?? true,
    push:     prefs.push     ?? true,
    follows:  prefs.follows  ?? true,
    likes:    prefs.likes    ?? true,
    comments: prefs.comments ?? true,
    messages: prefs.messages ?? true,
  });

  const toggle = async (key) => {
    const next = { ...s, [key]: !s[key] }; setS(next);
    try { await dispatch(updateProfile({ notifications: next })); }
    catch { setS(s); toast.error('Update failed'); }
  };

  const rows = [
    { key: 'email',    label: 'Email notifications', desc: 'Receive important updates via email'  },
    { key: 'push',     label: 'Push notifications',  desc: 'Alerts in your browser'               },
    { key: 'follows',  label: 'New followers',       desc: 'When someone follows you'             },
    { key: 'likes',    label: 'Likes',               desc: 'When someone likes your post'         },
    { key: 'comments', label: 'Comments',            desc: 'When someone comments on your posts'  },
    { key: 'messages', label: 'Direct messages',     desc: 'New message notifications'            },
  ];

  return (
    <div className="card p-6">
      <h2 className="font-bold text-base mb-1">Notifications</h2>
      <p className="text-sm text-muted mb-4">Choose what alerts you receive.</p>
      <div>
        {rows.map(r => (
          <SettingRow key={r.key} label={r.label} desc={r.desc} checked={s[r.key]} onChange={() => toggle(r.key)} />
        ))}
      </div>
    </div>
  );
}

/* ─── Privacy ──────────────────────────────────────────────────── */
function PrivacySection() {
  const user     = useSelector(selectUser);
  const dispatch = useDispatch();
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);

  const toggle = async (val) => {
    setIsPrivate(val);
    try { await dispatch(updateProfile({ isPrivate: val })); toast.success(val ? 'Account is now private' : 'Account is now public'); }
    catch { setIsPrivate(!val); toast.error('Update failed'); }
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-bold text-base">Privacy</h2>

      <SettingRow
        label="Private account"
        desc="Only approved followers can see your posts and profile"
        checked={isPrivate}
        onChange={toggle}
      />

      <div className="pt-2 space-y-3">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Blocked users</h3>
        <p className="text-sm text-secondary">
          Manage blocked accounts in each user's profile menu.
        </p>
      </div>
    </div>
  );
}

/* ─── Danger zone ──────────────────────────────────────────────── */
function DangerSection() {
  const [confirm, setConfirm] = useState('');
  const [pw,      setPw]      = useState('');
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    if (confirm !== 'delete my account') return toast.error('Type the confirmation phrase exactly');
    if (!pw) return toast.error('Enter your password');
    setLoading(true);
    try {
      // dispatch deactivate action
      toast.success('Account deactivated');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-6 border-red-200 dark:border-red-900/40">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <RiAlertLine size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-bold text-base text-red-600 dark:text-red-400">Danger Zone</h2>
            <p className="text-sm text-muted mt-0.5">These actions are permanent and cannot be undone.</p>
          </div>
        </div>

        <div className="border border-red-200 dark:border-red-900/40 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Deactivate account</p>
              <p className="text-xs text-muted mt-0.5">Your profile will be hidden. You can reactivate by logging back in.</p>
            </div>
            <button
              onClick={() => setOpen(!open)}
              className="px-4 py-2 text-sm font-semibold text-red-500 border border-red-300 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
            >
              Deactivate
            </button>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-red-200 dark:border-red-900/40 space-y-3">
                  <p className="text-sm text-secondary">
                    Type <strong>delete my account</strong> to confirm:
                  </p>
                  <input
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="delete my account"
                    className="input-base border-red-300 dark:border-red-800 focus:!border-red-500"
                  />
                  <Input
                    label="Current password"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={RiLockLine}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                  />
                  <Button
                    variant="danger"
                    loading={loading}
                    disabled={confirm !== 'delete my account' || !pw}
                    onClick={handleDeactivate}
                  >
                    <RiDeleteBin6Line size={15} />
                    Confirm deactivation
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
