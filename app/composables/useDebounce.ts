import { ref, watch } from "vue";
import type { Ref } from "vue";

export function useDebounceFn<TArgs extends unknown[]>(
  fn: (...args: TArgs) => unknown,
  delay: number
): (...args: TArgs) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function refDebounced<T>(source: Ref<T>, delay: number): Ref<T> {
  const debounced = ref(source.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | null = null;
  watch(source, (newValue) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.value = newValue;
    }, delay);
  });
  return debounced;
}
