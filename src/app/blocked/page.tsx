export default function BlockedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          접근이 거부되었습니다
        </h1>
        <p className="text-gray-600 mb-6">
          이 페이지는 인증된 사용자만 접근할 수 있습니다.
        </p>
        <a
          href="http://localhost:3000"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-block"
        >
          메인 페이지로 이동
        </a>
      </div>
    </div>
  )
}
