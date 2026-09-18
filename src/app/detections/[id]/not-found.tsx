import Link from "next/link";

export default function DetectionNotFound() {
  return (
    <div className="border border-line bg-panel px-6 py-12 text-center shadow-[0_1px_1px_0_rgba(0,28,36,0.3)]">
      <h1 className="text-[20px] font-normal text-ink">Detection not found</h1>
      <p className="mt-2 text-[13px] text-muted">
        That ID is not in the synthetic fixture set.
      </p>
      <Link href="/" className="mt-4 inline-block text-[13px] text-blue hover:underline">
        Back to queue
      </Link>
    </div>
  );
}
