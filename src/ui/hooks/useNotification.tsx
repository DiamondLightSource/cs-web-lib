import { useDispatch } from "react-redux";
import { notificationDispatcher } from "../../redux/notificationUtils";

export const useNotification = () => {
  const dispatch = useDispatch();
  return notificationDispatcher(dispatch);
};
