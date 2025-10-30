export default function Navigation() {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">AccuBooks Documentation</h1>
        <div className="space-x-4">
          <a href="/" className="hover:text-blue-200">Home</a>
          <a href="/api" className="hover:text-blue-200">API</a>
          <a href="/guides" className="hover:text-blue-200">Guides</a>
        </div>
      </div>
    </nav>
  )
}
