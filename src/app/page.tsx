import ReceiptUploader from './components/ReceiptUploader'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Fresh Track</h1>
        <p className="mb-8">Upload your grocery receipt to get estimated expiry dates for your items.</p>
        <ReceiptUploader />
      </div>
    </main>
  )
}