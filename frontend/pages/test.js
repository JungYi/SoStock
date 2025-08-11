import toast from 'react-hot-toast';

export default function Home() {
  const testToast = () => {
    toast.success('✅ This is a success toast!');
    // toast.error('❌ This is an error toast!');
    // toast('ℹ️ This is a neutral toast');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Toast Test</h1>
      <button
        onClick={testToast}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Show Toast
      </button>
    </div>
  );
}