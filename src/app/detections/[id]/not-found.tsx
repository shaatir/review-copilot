import Link from "next/link";

export default function DetectionNotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-lg font-semibold">Detection not found</h1>
      <p className="mt-2 text-sm text-muted">
        That ID is not in the synthetic fixture set.
      </p>
      <Link href="/" className="mt-4 inline-block text-sm text-accent hover:underline">
        Back to queue
      </Link>
    </div>
  );
}
