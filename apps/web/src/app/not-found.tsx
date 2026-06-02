import Link from "next/link";
import { BrandMonogram } from "@/components/brand";
import { Button } from "@/components/heroui-pro/button";

export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
          <BrandMonogram letter="R" size="sm" className="rounded-lg" />
          Raltic
        </Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <div className="mt-8 flex justify-center gap-3 text-sm">
          <Button render={<Link href="/" />}>Go home</Button>
          <Button variant="outline" render={<Link href="/login" />}>Sign in</Button>
        </div>
      </div>
    </div>
  );
}
