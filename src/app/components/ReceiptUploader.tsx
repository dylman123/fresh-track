'use client'

import { Fragment, useState } from 'react'
import Image from 'next/image'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ExpiryItem } from '../../../lib/types'
import { formatDate } from '../../../lib/util'
import exampleReceipt from '../../../public/example.jpeg'

export default function ReceiptUploader() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [results, setResults] = useState<ExpiryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const showExample = async () => {
    setPreview(exampleReceipt.src)
    setResults([])
    const response = await fetch(exampleReceipt.src)
    const blob = await response.blob()
    const file = new File([blob], 'example.jpeg', { type: 'image/jpeg' })
    setImage(file)
    setIsNotificationsEnabled(false)
  }

  const saveItems = async (items: ExpiryItem[]) => {
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
      if (data.error) {
        toast.error(data.error)
      } else {
        const items = data as ExpiryItem[]
        // Set purchase date to today for all items
        const today = new Date().toISOString()
        items.forEach((item: ExpiryItem) => {
          item.purchaseDate = today
        })
        setResults(items)
      }
    } catch (error) {
      console.error('Error analyzing receipt:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (index: number, field: keyof ExpiryItem, value: string) => {
    const updatedResults = [...results]
    updatedResults[index] = {
      ...updatedResults[index],
      [field]: field === 'expiryDate' ? new Date(value).toISOString() : value
    }
    setResults(updatedResults)
  }

  const handleDelete = (index: number) => {
    const updatedResults = results.filter((_, i) => i !== index)
    setResults(updatedResults)
  }

  const handleAddItem = () => {
    const newItem: ExpiryItem = {
      code: '',
      name: '',
      category: 'other',
      storageType: 'room temperature',
      expiryDate: new Date().toISOString(),
      purchaseDate,
      notes: ''
    }
    setResults([newItem, ...results])
    setEditingIndex(0)
  }

  const handleSetPurchaseDate = (date: string) => {
    setPurchaseDate(date)
    const updatedResults = results.map((item: ExpiryItem) => {
      const dateDiff = new Date(item.expiryDate).getTime() - new Date(item.purchaseDate).getTime()
      const daysDiff = Math.ceil(dateDiff / (1000 * 60 * 60 * 24))
      item.purchaseDate = date
      item.expiryDate = new Date(new Date(date).getTime() + daysDiff * 24 * 60 * 60 * 1000).toISOString()
      return item
    })
    setResults(updatedResults)
  }

  const toggleExpanded = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <div className="space-y-4">

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <div className="flex flex-col gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full"
          />
        </div>
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

      <div className="flex gap-4 mb-4 justify-center">
        {!preview && <button
          onClick={showExample}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded transition-colors"
        >
          Use Example Receipt
        </button>}
        <button
        onClick={handleSubmit}
        disabled={!image || loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
          {loading ? 'Analyzing...' : 'Analyze Receipt'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h2 className="text-xl font-semibold mb-4 sm:mb-0">Estimated Expiry Dates</h2>
            <div className="flex items-center gap-2">
                <label htmlFor="purchaseDate" className="text-sm text-gray">
                Purchase Date:
                </label>
                <input
                    type="date"
                    id="purchaseDate"   
                    value={purchaseDate}
                    onChange={(e) => handleSetPurchaseDate(e.target.value)}
                    className="border rounded px-2 py-1 text-black"
                />
            </div>
            <button
            onClick={handleAddItem}
            className="bg-blue-500 hover:bg-blue-600 text-white mt-4 sm:mt-0 px-4 py-2 rounded"
            >
            Add Item
            </button>
          </div>
          <div className="bg-white shadow rounded-lg relative">
            {/* Desktop View */}
            <div className="hidden sm:block">
              <div className="relative">
                <table className="w-full table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-50 divide-y divide-gray-200">
                    {results.map((item, index) => {
                      const purchaseDate = new Date(item.purchaseDate)
                      const expiryDate = new Date(item.expiryDate)
                      const today = new Date()
                      const totalDays = Math.ceil(
                        (expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
                      )
                      const daysElapsed = Math.ceil(
                        (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
                      )
                      const daysRemaining = totalDays - daysElapsed
                      
                      let status
                      let statusColor
                      if (daysRemaining < 0) {
                        status = 'Expired'
                        statusColor = 'text-red-600 bg-red-100'
                      } else if (daysRemaining < 7) {
                        status = 'Expiring Soon'
                        statusColor = 'text-yellow-600 bg-yellow-100'
                      } else {
                        status = 'Good'
                        statusColor = 'text-green-600 bg-green-100'
                      }

                      const isEditing = editingIndex === index
                      const isExpanded = expandedRows.has(index);

                      return (
                        <Fragment key={index}>
                          <tr className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              <div className="max-w-[150px] break-words">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handleEdit(index, 'name', e.target.value)}
                                    className="w-full p-1 border rounded"
                                  />
                                ) : (
                                  item.name
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={item.expiryDate.split('T')[0]}
                                  onChange={(e) => handleEdit(index, 'expiryDate', e.target.value)}
                                  className="w-full p-1 border rounded"
                                />
                              ) : (
                                formatDate(item.expiryDate)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap w-[120px]">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleExpanded(index)}
                                  className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                                >
                                  {isExpanded ? 'Less' : 'More'}
                                </button>
                                <button
                                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                                  className={`p-2 rounded ${
                                    editingIndex === index 
                                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  {editingIndex === index ? 'Save' : 'Edit'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-gray-50">
                              <td colSpan={4} className="px-4 py-4">
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm font-medium text-gray-500">Item Code:</div>
                                    <div className="text-sm text-gray-900">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={item.code}
                                          onChange={(e) => handleEdit(index, 'code', e.target.value)}
                                          className="w-full p-1 border rounded"
                                        />
                                      ) : (
                                        item.code
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm font-medium text-gray-500">Category:</div>
                                    <div className="text-sm text-gray-900">
                                      {isEditing ? (
                                        <select
                                          value={item.category}
                                          onChange={(e) => handleEdit(index, 'category', e.target.value)}
                                          className="w-full p-1 border rounded"
                                        >
                                          <option value="produce">Produce</option>
                                          <option value="dairy">Dairy</option>
                                          <option value="meat">Meat</option>
                                          <option value="pantry">Pantry</option>
                                          <option value="other">Other</option>
                                        </select>
                                      ) : (
                                        <span className="capitalize">{item.category}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm font-medium text-gray-500">Storage:</div>
                                    <div className="text-sm text-gray-900">
                                      {isEditing ? (
                                        <select
                                          value={item.storageType}
                                          onChange={(e) => handleEdit(index, 'storageType', e.target.value)}
                                          className="w-full p-1 border rounded"
                                        >
                                          <option value="refrigerated">Refrigerated</option>
                                          <option value="frozen">Frozen</option>
                                          <option value="room temperature">Room Temperature</option>
                                        </select>
                                      ) : (
                                        <span className="capitalize">{item.storageType}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="text-sm font-medium text-gray-500">Notes:</div>
                                    <div className="text-sm text-gray-900">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={item.notes || ''}
                                          onChange={(e) => handleEdit(index, 'notes', e.target.value)}
                                          className="w-full p-1 border rounded"
                                        />
                                      ) : (
                                        item.notes || '-'
                                      )}
                                    </div>
                                  </div>
                                  {isEditing && (
                                    <div className="pt-2">
                                      <button
                                        onClick={() => handleDelete(index)}
                                        className="px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-50 divide-y divide-gray-200">
                  {results.map((item, index) => {
                    const isEditing = editingIndex === index
                    const isExpanded = expandedRows.has(index);
                    // Calculate status colors
                    const purchaseDate = new Date(item.purchaseDate)
                    const expiryDate = new Date(item.expiryDate)
                    const today = new Date()
                    const totalDays = Math.ceil(
                      (expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
                    )
                    const daysElapsed = Math.ceil(
                      (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
                    )
                    const daysRemaining = totalDays - daysElapsed
                    
                    let status
                    let statusColor
                    let expiryColor
                    if (daysRemaining < 0) {
                      status = 'Expired'
                      statusColor = 'text-red-600 bg-red-100'
                      expiryColor = 'text-red-600'
                    } else if (daysRemaining < 7) {
                      status = 'Expiring Soon'
                      statusColor = 'text-yellow-600 bg-yellow-100'
                      expiryColor = 'text-yellow-600'
                    } else {
                      status = 'Good'
                      statusColor = 'text-green-600 bg-green-100'
                      expiryColor = 'text-green-600'
                    }

                    return (
                      <Fragment key={index}>
                        <tr className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            <div className="max-w-[150px] break-words">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleEdit(index, 'name', e.target.value)}
                                  className="w-full p-1 border rounded"
                                />
                              ) : (
                                item.name
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {isEditing ? (
                              <input
                                type="date"
                                value={item.expiryDate.split('T')[0]}
                                onChange={(e) => handleEdit(index, 'expiryDate', e.target.value)}
                                className="w-full p-1 border rounded"
                              />
                            ) : (
                              <span className={`font-medium ${expiryColor}`}>
                                {formatDate(item.expiryDate)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                              className={`px-3 py-1 rounded ${
                                editingIndex === index 
                                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                              }`}
                            >
                              {editingIndex === index ? 'Save' : 'Edit'}
                            </button>
                          </td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td colSpan={3} className="px-4">
                            <button
                              onClick={() => toggleExpanded(index)}
                              className="w-full text-gray-500 text-sm flex items-center justify-center"
                            >
                              {isExpanded ? '▲ Less Details' : '▼ More Details'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="px-4 py-4">
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-sm font-medium text-gray-500">Status:</div>
                                  <div className="text-sm text-gray-900">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                                      {status}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-sm font-medium text-gray-500">Item Code:</div>
                                  <div className="text-sm text-gray-900">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={item.code}
                                        onChange={(e) => handleEdit(index, 'code', e.target.value)}
                                        className="w-full p-1 border rounded"
                                      />
                                    ) : (
                                      item.code
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-sm font-medium text-gray-500">Category:</div>
                                  <div className="text-sm text-gray-900">
                                    {isEditing ? (
                                      <select
                                        value={item.category}
                                        onChange={(e) => handleEdit(index, 'category', e.target.value)}
                                        className="w-full p-1 border rounded"
                                      >
                                        <option value="produce">Produce</option>
                                        <option value="dairy">Dairy</option>
                                        <option value="meat">Meat</option>
                                        <option value="pantry">Pantry</option>
                                        <option value="other">Other</option>
                                      </select>
                                    ) : (
                                      <span className="capitalize">{item.category}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-sm font-medium text-gray-500">Storage:</div>
                                  <div className="text-sm text-gray-900">
                                    {isEditing ? (
                                      <select
                                        value={item.storageType}
                                        onChange={(e) => handleEdit(index, 'storageType', e.target.value)}
                                        className="w-full p-1 border rounded"
                                      >
                                        <option value="refrigerated">Refrigerated</option>
                                        <option value="frozen">Frozen</option>
                                        <option value="room temperature">Room Temperature</option>
                                      </select>
                                    ) : (
                                      <span className="capitalize">{item.storageType}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-sm font-medium text-gray-500">Notes:</div>
                                  <div className="text-sm text-gray-900">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={item.notes || ''}
                                        onChange={(e) => handleEdit(index, 'notes', e.target.value)}
                                        className="w-full p-1 border rounded"
                                      />
                                    ) : (
                                      item.notes || '-'
                                    )}
                                  </div>
                                </div>
                                {isEditing && (
                                  <div className="pt-2">
                                    <button
                                      onClick={() => handleDelete(index)}
                                      className="px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
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