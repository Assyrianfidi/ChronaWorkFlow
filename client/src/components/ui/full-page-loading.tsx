import { Icons } from '../icons';

export function FullPageLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
