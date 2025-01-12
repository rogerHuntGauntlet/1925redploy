import { FC, useState, useEffect, useRef } from 'react'
import { X, Upload, Camera, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ErrorBoundary from './ErrorBoundary'

interface ProfileModalProps {
  currentUser: { id: string; email: string };
  onClose: () => void;
}

interface Profile {
  username: string;
  avatar_url: string;
  phone: string;
  bio: string;
  employer: string;
}

const ProfileModal: FC<ProfileModalProps> = ({ currentUser, onClose }) => {
  const [profile, setProfile] = useState<Profile>({
    username: '',
    avatar_url: '',
    phone: '',
    bio: '',
    employer: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
    return () => stopCamera()
  }, [])

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username, avatar_url, phone, bio, employer')
      .eq('id', currentUser.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to fetch profile. Please try again.')
    } else if (data) {
      setProfile(data)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera. Please check your permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const video = videoRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to the canvas
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert the canvas to a blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera_photo.jpg', { type: 'image/jpeg' });
          setAvatarFile(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      return publicUrlData.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      let avatar_url = profile.avatar_url

      if (avatarFile) {
        avatar_url = await uploadAvatar(avatarFile)
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          username: profile.username, 
          avatar_url, 
          phone: profile.phone, 
          bio: profile.bio, 
          employer: profile.employer,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)

      if (error) throw error

      onClose()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  return (
    <ErrorBoundary fallback={
      <div className="p-4">
        <p className="text-red-600">Unable to load profile settings. Please try again later.</p>
      </div>
    }>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold">Profile Settings</h2>
          </div>

          <ErrorBoundary fallback={
            <div className="p-4">
              <p className="text-yellow-600">Unable to load profile data.</p>
            </div>
          }>
            <div className="p-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800">
                      {avatarFile || profile.avatar_url ? (
                        <img
                          src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <User size={40} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <label className="cursor-pointer p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Upload size={18} className="text-blue-500" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={stream ? takePhoto : startCamera}
                        className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <Camera size={18} className="text-green-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {stream && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000]">
                    <div className="relative bg-gray-800 p-4 rounded-lg">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline
                        muted
                        className="rounded-lg max-w-full max-h-[80vh] mirror-mode"
                      />
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                        <button
                          type="button"
                          onClick={takePhoto}
                          className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                        >
                          <Camera size={24} />
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X size={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profile.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="employer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employer
                  </label>
                  <input
                    type="text"
                    id="employer"
                    name="employer"
                    value={profile.employer}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Enter your employer"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </ErrorBoundary>
        </div>
      </div>

      <style jsx global>{`
        .mirror-mode {
          transform: scaleX(-1);
        }
      `}</style>
    </ErrorBoundary>
  )
}

export default ProfileModal
