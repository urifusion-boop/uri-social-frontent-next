import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { toast } from 'react-hot-toast';

export class ToastService {
  // durationMs: keep a long explanation (e.g. why a post didn't publish) on screen long
  // enough to read; omitted, the library's default applies as before.
  static showToast(message: string, type: ToastTypeEnum = ToastTypeEnum.Success, durationMs?: number) {
    const opts = durationMs ? { duration: durationMs } : undefined;
    switch (type) {
      case ToastTypeEnum.Success:
        toast.success(message, opts);
        break;
      case ToastTypeEnum.Error:
        toast.error(message, opts);
        break;
      default:
        toast(message, opts);
        break;
    }
  }

  static showResponseToast<T>(response: UriResponse<T>) {
    if (response.status && response.responseCode === 200) {
      toast.success(response.responseMessage || 'Operation successful');
    } else {
      toast.error(response.responseMessage || 'An error occurred');
    }
  }
}
