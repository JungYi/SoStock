type ButtonProps = {
  label: string;
};

export default function Button({ label }: ButtonProps) {
  return (
    <button className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
      {label}
    </button>
  );
}
