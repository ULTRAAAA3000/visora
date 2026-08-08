import GuideBody from '../../components/guide/GuideBody';

export default function Guide() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-medium mb-1">Guide</h1>
      <p className="text-gray-400 text-sm mb-8">
        A start-to-finish walkthrough — useful whether you're writing code or not.
      </p>

      <GuideBody />
    </div>
  );
}
