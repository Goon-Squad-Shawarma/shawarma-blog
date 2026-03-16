import { TriangleAlert } from "lucide-react";

interface WarningToastProps {
  message?: string;
}

export default function WarningToast({ message = "Some information is missing!" }: WarningToastProps) {
  return (
    <div className="rounded-md border border-amber-500/50 px-4 py-3 text-amber-600 bg-background shadow-lg">
      <p className="text-sm">
        <TriangleAlert
          aria-hidden="true"
          className="-mt-0.5 me-3 inline-flex opacity-60"
          size={16}
        />
        {message}
      </p>
    </div>
  );
}
