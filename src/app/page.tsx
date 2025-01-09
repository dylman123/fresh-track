import ReceiptUploader from './components/ReceiptUploader'
import broccoli from '../../public/broccoli.png'
import Image from 'next/image'
export default function Home() {
  return (
    <main className="min-h-screen p-1">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mt-14 mb-4">
            <Image src={broccoli} alt="Broccoli" className="w-16 h-16 mb-4" />
            <h1 className="text-3xl sm:text-5xl font-bold">Fresh Track</h1>
            <Image src={broccoli} alt="Broccoli" className="w-16 h-16 mb-4" />
          </div>
          <p className="text-sm sm:text-base text-gray-200 px-4">
            Get notified when your groceries are about to expire. All you need is a photo of your grocery receipt.
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