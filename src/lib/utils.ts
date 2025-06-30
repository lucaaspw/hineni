import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safari-safe body scroll management
export function disableBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.classList.add("dialog-open");
  return scrollY;
}

export function enableBodyScroll(scrollY?: number) {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.classList.remove("dialog-open");
  if (scrollY !== undefined) {
    window.scrollTo(0, scrollY);
  }
}
