import { toaster } from "../api";

export function Copyable(toast, item) {
  toaster(
    toast,
    navigator.clipboard.writeText(item).then((success) => "Copied to clipboard")
  );
}
