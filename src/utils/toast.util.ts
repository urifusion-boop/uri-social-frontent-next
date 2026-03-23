import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { UriResponse } from '@/src/models/responses/UriResponse';
import { toast } from 'react-hot-toast';

export class ToastService {
  static showToast(message: string, type: ToastTypeEnum = ToastTypeEnum.Success) {
    switch (type) {
      case ToastTypeEnum.Success:
        toast.success(message);
        break;
      case ToastTypeEnum.Error:
        toast.error(message);
        break;
      default:
        toast(message);
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
