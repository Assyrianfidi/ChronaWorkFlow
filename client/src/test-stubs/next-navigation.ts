export type NextRouter = {
  push: (...args: any[]) => any;
  replace: (...args: any[]) => any;
  prefetch: (...args: any[]) => any;
  back: () => void;
  forward: () => void;
  refresh: () => void;
};

export function useRouter(): NextRouter {
  return {
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  };
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams();
}

export function usePathname(): string {
  return "/";
}

export function useParams(): Record<string, string> {
  return {};
}
