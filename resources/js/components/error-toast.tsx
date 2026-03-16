import { CircleAlert } from "lucide-react";

interface ErrorToastProps {
  message?: string;
}

export default function ErrorToast({ message = "An error occurred!" }: ErrorToastProps) {
  return (
    <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600 bg-background shadow-lg">
      <p className="text-sm">
        <CircleAlert
          aria-hidden="true"
          className="-mt-0.5 me-3 inline-flex opacity-60"
          size={16}
        />
        {message}
      </p>
    </div>
  );
}
