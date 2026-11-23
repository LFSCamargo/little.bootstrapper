import Link from 'next/link';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@little-bootstrapper/ui-web';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-teal-600 dark:text-teal-400">
            404 — Wrong Dimension!
          </CardTitle>
          <CardDescription>
            Good news, everyone! That delivery route doesn&apos;t exist in this universe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Return to Planet Express HQ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
