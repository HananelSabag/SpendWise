import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Camera, X, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../stores';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { Avatar } from '../../ui';
import { api } from '../../../api';
import { cn } from '../../../utils/helpers';
import useAuthStore from '../../../stores/authStore';

export const AvatarSection = ({ user, authToasts }) => {
  const [uploading, setUploading]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview]       = useState(null);
  const [viewOpen, setViewOpen]     = useState(false);
  const fileInputRef                = useRef(null);
  const { t }                       = useTranslation('profile');
  const isMobile                    = useIsMobile();

  useEffect(() => {
    return () => { if (preview?.url) URL.revokeObjectURL(preview.url); };
  }, []); // eslint-disable-line

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    const { validateImageFile, processImageForUpload } = await import('../../../utils/imageProcessor');
    const validation = validateImageFile(file, { maxSizeMB: 50 });
    if (!validation.valid) { authToasts.toast?.error(validation.error); return; }

    setProcessing(true);
    try {
      const { file: processed, originalSize, newSize } = await processImageForUpload(file, {
        maxSizeMB: 5, maxWidthOrHeight: 2048, quality: 0.85,
      });
      const finalSizeMB = processed.size / (1024 * 1024);
      if (finalSizeMB > 20) {
        authToasts.toast?.error(`Image too large after compression (${finalSizeMB.toFixed(1)}MB).`); return;
      }
      setPreview({
        url: URL.createObjectURL(processed),
        file: processed,
        finalSizeMB: finalSizeMB.toFixed(1),
        originalSizeMB: (originalSize / 1024 / 1024).toFixed(1),
        wasCompressed: newSize < originalSize * 0.95,
      });
    } catch {
      authToasts.toast?.error(t('personal.imageProcessingFailed') || 'Failed to process image.');
    } finally {
      setProcessing(false);
    }
  }, [authToasts, t]);

  const handleConfirmUpload = useCallback(async () => {
    if (!preview?.file) return;
    const fileToUpload = preview.file;
    const urlToRevoke  = preview.url;
    setPreview(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', fileToUpload);
      const res = await api.users.uploadAvatar(formData);
      if (res.success) {
        const url = res.data?.data?.url || res.data?.url;
        useAuthStore.setState({ user: { ...useAuthStore.getState().user, avatar: url, avatar_url: url } });
        document.querySelectorAll('img').forEach(img => {
          if (img.src?.includes('supabase') || img.alt === 'Profile') img.src = url + '?t=' + Date.now();
        });
        authToasts.avatarUploaded?.();
      } else {
        authToasts.avatarUploadFailed?.();
      }
    } catch {
      authToasts.avatarUploadFailed?.();
    } finally {
      setUploading(false);
      URL.revokeObjectURL(urlToRevoke);
    }
  }, [preview, authToasts]);

  const handleCancelPreview = useCallback(() => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }, [preview]);

  const busy = uploading || processing;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        {/* Avatar + camera */}
        <div className="relative shrink-0">
          <button
            onClick={() => !busy && setViewOpen(true)}
            disabled={busy}
            className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-indigo-100 dark:ring-indigo-900/40 focus:outline-none focus:ring-indigo-400 cursor-pointer block transition-opacity hover:opacity-90"
            aria-label={t('personal.viewPhoto') || 'View profile picture'}
          >
            <Avatar
              src={user?.avatar}
              alt={user?.name || user?.email}
              size="xl"
              fallback={(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              className="w-full h-full"
            />
          </button>
          {busy && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          <label className={cn(
            'absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center',
            'shadow-md border-2 border-white dark:border-gray-800 transition-colors duration-150',
            busy ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
          )}>
            <Camera className="w-3.5 h-3.5 text-white" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={busy}
            />
          </label>
        </div>

        {/* User info */}
        <div className="text-center sm:text-start">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {user?.name || user?.email?.split('@')[0]}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {t('personal.memberSince') || 'Member since'}{' '}
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </p>
          {processing && (
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1.5 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('personal.processingImage') || 'Processing image…'}
            </p>
          )}
        </div>
      </div>

      {/* Preview dialog */}
      {preview && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelPreview} />
          <div className="relative z-10 w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl px-6 pb-8 pt-5">
            <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('personal.changePhoto') || 'Change Photo'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('personal.newPhotoDesc') || 'This will be your new profile picture'}</p>
              </div>
              <button onClick={handleCancelPreview} aria-label="Close" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer ms-3">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex justify-center mb-5">
              <div className="relative">
                <img src={preview.url} alt={t('personal.previewAlt') || 'Preview'} className="w-36 h-36 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-indigo-900/40 shadow-xl" />
                {preview.wasCompressed && (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md">
                    {t('personal.optimized') || 'Optimized'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-center mb-6">
              {preview.wasCompressed ? (
                <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="line-through text-gray-400">{preview.originalSizeMB}MB</span>
                  <span>→</span>
                  <span className="font-semibold">{preview.finalSizeMB}MB</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">{preview.finalSizeMB}MB</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCancelPreview} className="flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <X className="w-4 h-4" />{t('actions.cancel') || 'Cancel'}
              </button>
              <button onClick={handleConfirmUpload} className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all cursor-pointer active:scale-95">
                <Check className="w-4 h-4" />{t('personal.setPhoto') || 'Set Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View photo dialog */}
      {viewOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewOpen(false)} />
          <div className={cn(
            'relative z-10 w-full bg-white dark:bg-gray-900 shadow-2xl',
            isMobile ? 'rounded-t-3xl px-6 pb-8 pt-5' : 'sm:max-w-sm sm:rounded-2xl px-6 pb-8 pt-5'
          )}>
            {isMobile && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('personal.profilePhoto') || 'Profile Photo'}</h3>
              <button onClick={() => setViewOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-indigo-100 dark:ring-indigo-900/40 shadow-2xl">
                <Avatar src={user?.avatar} alt={user?.name || user?.email} size="xl" fallback={(user?.name || user?.email || '?').charAt(0).toUpperCase()} className="w-full h-full object-cover" />
              </div>
            </div>
            <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
              {user?.name || user?.email?.split('@')[0]}
            </p>
            <label className="flex items-center justify-center gap-2 h-12 rounded-2xl cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
              <Camera className="w-4 h-4" />
              {t('personal.changePhoto') || 'Change Photo'}
              <input type="file" accept="image/*,.heic,.heif" className="hidden" disabled={busy}
                onChange={(e) => { setViewOpen(false); handleFileSelect(e); }} />
            </label>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarSection;
