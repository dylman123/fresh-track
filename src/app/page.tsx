import ReceiptUploader from './components/ReceiptUploader'

export default function Home() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Fresh Track</h1>
          <p className="text-sm sm:text-base text-gray-200 px-4">
            Upload your grocery receipt to get estimated expiry dates for your items.
          </p>
        </div>

        {/* Main Content */}
        <div className="rounded-lg shadow-sm p-4 sm:p-6">
          <ReceiptUploader />
        </div>

        {/* Optional: Add a footer */}
        <footer className="mt-8 text-center text-sm text-gray-200">
          <p>Never waste food again</p>
        </footer>

        <div className="mt-4 text-center text-sm text-gray-200">
          <p>Have feedback? Email <a href="mailto:dylan@dylanklein.dev" className="underline hover:text-white">dylan@dylanklein.dev</a></p>
        </div>
      </div>
    </main>
  )
}