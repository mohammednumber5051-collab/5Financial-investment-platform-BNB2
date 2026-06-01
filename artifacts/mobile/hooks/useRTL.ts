import { I18nManager } from "react-native";

export function useRTL() {
  const isRTL = I18nManager.isRTL;

  function flipIfRTL<T>(ltr: T, rtl: T): T {
    return isRTL ? rtl : ltr;
  }

  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const flexDirection = isRTL ? ("row-reverse" as const) : ("row" as const);
  const alignSelf = isRTL ? ("flex-end" as const) : ("flex-start" as const);
  const marginStart = isRTL ? "marginRight" : "marginLeft";
  const marginEnd = isRTL ? "marginLeft" : "marginRight";
  const paddingStart = isRTL ? "paddingRight" : "paddingLeft";
  const paddingEnd = isRTL ? "paddingLeft" : "paddingRight";

  return {
    isRTL,
    flipIfRTL,
    textAlign,
    flexDirection,
    alignSelf,
    marginStart,
    marginEnd,
    paddingStart,
    paddingEnd,
  };
}
