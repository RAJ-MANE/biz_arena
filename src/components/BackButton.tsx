import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      onClick={() => router.back()}
      variant="ghost"
      className="px-3 py-2 rounded-lg hover:bg-primary/10 text-primary font-medium shadow-sm border border-transparent mr-3 transition-all"
      aria-label="Go back"
    >
      ← Back
    </Button>
  );
}
