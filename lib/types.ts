export interface ExpiryItem {
  id: string
  item: string
  expiryDate: string
  email: string
  notificationSent?: boolean
} 

type AnalyzedItemDetails = {
  expiryDate: string
  category: string
  storageType: string
  notes?: string
}

export type AnalyzedResults = {
  [key: string]: AnalyzedItemDetails
}
