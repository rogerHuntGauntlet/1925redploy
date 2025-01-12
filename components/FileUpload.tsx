import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, X } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'

interface FileUploadProps {
  onUpload: (url: string, fileName: string) => void
  maxSize?: number // in bytes
  allowedTypes?: string[]
}

export default function FileUpload({
  onUpload,
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = ['image/*', 'application/pdf', 'text/plain']
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (file.size > maxSize) {
      alert('File is too large')
      return
    }
    
    if (!allowedTypes.some(type => file.type.match(type))) {
      alert('File type not allowed')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('message_attachments')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('message_attachments')
        .getPublicUrl(fileName)

      onUpload(publicUrl, file.name)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <ErrorBoundary fallback={
      <div className="p-4">
        <p className="text-red-600">File upload functionality is unavailable. Please try again later.</p>
      </div>
    }>
      <div className="w-full">
        <ErrorBoundary fallback={
          <div className="p-2 bg-red-50 rounded">
            <p className="text-red-600">Upload interface is currently unavailable.</p>
          </div>
        }>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadFile(file)
              }}
              className="hidden"
              multiple
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Select Files
            </button>
            {/* File list and upload progress */}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  )
}
