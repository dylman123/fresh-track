'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AnalyzedResults } from '../../../lib/types'

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ReceiptUploader() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [results, setResults] = useState<AnalyzedResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const saveItems = async (items: AnalyzedResults) => {
    try {
      await fetch('/api/save-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          email
        }),
      })
    } catch (error) {
      console.error('Error saving items:', error)
    }
  }

  const handleSubmit = async () => {
    if (!image) return

    setLoading(true)
    const formData = new FormData()
    formData.append('receipt', image)

    try {
      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setResults(data as AnalyzedResults)
    } catch (error) {
      console.error('Error analyzing receipt:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full"
        />
      </div>

      {preview && (
        <div className="relative h-64 w-full">
          <Image
            src={preview}
            alt="Receipt preview"
            fill
            className="object-contain"
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!image || loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        {loading ? 'Analyzing...' : 'Analyze Receipt'}
      </button>

      {results && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Estimated Expiry Dates</h2>
          <div className="bg-white shadow rounded-lg overflow-x">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Storage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(results).map(([item, details], index) => {
                  const expiryDate = new Date(details.expiryDate)
                  const today = new Date()
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            
                  let status
                  let statusColor
                  if (daysUntilExpiry < 0) {
                    status = 'Expired'
                    statusColor = 'text-red-600 bg-red-100'
                  } else if (daysUntilExpiry < 7) {
                    status = 'Expiring Soon'
                    statusColor = 'text-yellow-600 bg-yellow-100'
                  } else {
                    status = 'Good'
                    statusColor = 'text-green-600 bg-green-100'
                  }

                  return (
                     <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {details.category}
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {details.storageType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(details.expiryDate)}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 mt-8">Additional Notes</h3>
            <div className="space-y-2">
              {Object.entries(results).map(([item, details], index) => (
                details.notes && (
                  <div key={index} className="p-3 bg-gray-50/50 rounded border border-gray-100">
                    <h4 className="text-sm mb-0.5">{item}</h4>
                    <p className="text-xs">{details.notes}</p>
                  </div>
                )
              ))}
            </div>
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email for expiry notifications"
            className="w-full p-2 border rounded mt-8 mb-4 text-black"
            required
          />

          <button
            onClick={async () => {
              try {
                setIsSaving(true)
                await saveItems(results)
                setIsSaving(false)
                toast.success('Notifications enabled successfully!')
                setIsNotificationsEnabled(true)
              } catch {
                setIsSaving(false)
                toast.error('Failed to enable notifications')
              }
            }}
            disabled={isSaving || isNotificationsEnabled}
            className={`${
              isSaving ? 'bg-blue-400' :
              isNotificationsEnabled ? 'bg-gray-400 cursor-not-allowed' :
              'bg-blue-500 hover:bg-blue-600'
            } text-white px-4 py-2 rounded flex items-center justify-center transition-colors`}
          >
            {isNotificationsEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
          </button>
        </div>
      )}
    </div>
  )
}