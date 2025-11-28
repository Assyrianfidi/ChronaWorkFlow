import { renderHook, act } from '@testing-library/react';
import { useToast } from '../hooks/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add toast when toast function is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Test Title',
        description: 'Test Description',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Title',
      description: 'Test Description',
      variant: 'default',
      duration: 5000,
    });
  });

  it('should dismiss toast when dismiss is called', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      toastId = result.current.toast({
        title: 'Test Title',
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should clear all toasts when clear is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
      result.current.toast({ title: 'Toast 3' });
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.clear();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should auto-dismiss toast after duration', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Auto dismiss test',
        duration: 1000,
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should not auto-dismiss toast with duration 0', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'No auto dismiss',
        duration: 0,
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    // Fast-forward time significantly
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('should use default values for optional properties', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Default values test',
      });
    });

    expect(result.current.toasts[0]).toMatchObject({
      title: 'Default values test',
      variant: 'default',
      duration: 5000,
    });
    expect(result.current.toasts[0].description).toBeUndefined();
  });

  it('should generate unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
    });

    const [toast1, toast2] = result.current.toasts;
    expect(toast1.id).not.toBe(toast2.id);
    expect(typeof toast1.id).toBe('string');
    expect(typeof toast2.id).toBe('string');
  });

  it('should handle different toast variants', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Success',
        variant: 'success',
      });
      result.current.toast({
        title: 'Error',
        variant: 'destructive',
      });
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Success',
      variant: 'success',
    });
    expect(result.current.toasts[1]).toMatchObject({
      title: 'Error',
      variant: 'destructive',
    });
  });
});
