export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to Soundchecks</h1>
      <p className="text-xl text-gray-600 mb-8">Log your concert history and find your next show!</p>
      <a 
        href="/concerts/new" 
        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
      >
        Log Your First Concert
      </a>
    </main>
  );
}