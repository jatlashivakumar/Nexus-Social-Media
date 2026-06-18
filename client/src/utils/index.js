import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export const cn = (...i) => twMerge(clsx(i));
export const timeAgo = (d) => formatDistanceToNow(new Date(d), { addSuffix: true });
export const isDateToday = (d) => { const dt = new Date(d), n = new Date(); return dt.toDateString() === n.toDateString(); };
export const formatMessageTime = (d) => { const dt = new Date(d); if (isToday(dt)) return format(dt, 'h:mm a'); if (isYesterday(dt)) return `Yesterday ${format(dt, 'h:mm a')}`; return format(dt, 'MMM d'); };
export const formatDate = (d, f = 'MMM d, yyyy') => format(new Date(d), f);
export const formatCount = (n) => { if (!n) return '0'; if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`; return String(n); };
export const parseContent = (t) => { if (!t) return ''; return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/@(\w+)/g,'<a href="/profile/$1" class="text-nexus font-semibold hover:underline">@$1</a>').replace(/#(\w+)/g,'<a href="/explore?tag=$1" class="text-nexus font-semibold hover:underline">#$1</a>').replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer" class="text-nexus underline">$1</a>'); };
export const getAvatarUrl = (u) => u?.avatar?.url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.username||'u')}&backgroundColor=6366f1&textColor=ffffff&fontSize=42`;
export const copyToClipboard = async (t) => { try { await navigator.clipboard.writeText(t); return true; } catch { return false; } };
export const getErrorMessage = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
export const scrollToBottom = (r, b='smooth') => r?.current?.scrollTo({ top: r.current.scrollHeight, behavior: b });
export const formatFileSize = (b) => { if (!b) return '0B'; if (b<1024) return `${b}B`; if (b<1048576) return `${(b/1024).toFixed(1)}KB`; return `${(b/1048576).toFixed(1)}MB`; };
export const truncate = (s, n=120) => s?.length > n ? `${s.slice(0,n)}…` : s||'';
