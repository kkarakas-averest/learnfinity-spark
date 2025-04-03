import {
  require_react
} from "./chunk-QZ55VL3A.js";
import {
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/@radix-ui+react-use-callback-ref@1.1.0_@types+react@18.3.18_react@18.3.1/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var React = __toESM(require_react(), 1);
function useCallbackRef(callback) {
  const callbackRef = React.useRef(callback);
  React.useEffect(() => {
    callbackRef.current = callback;
  });
  return React.useMemo(() => (...args) => {
    var _a;
    return (_a = callbackRef.current) == null ? void 0 : _a.call(callbackRef, ...args);
  }, []);
}

// node_modules/.pnpm/@radix-ui+react-use-layout-effect@1.1.0_@types+react@18.3.18_react@18.3.1/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var React2 = __toESM(require_react(), 1);
var useLayoutEffect2 = Boolean(globalThis == null ? void 0 : globalThis.document) ? React2.useLayoutEffect : () => {
};

export {
  useCallbackRef,
  useLayoutEffect2
};
//# sourceMappingURL=chunk-LHQPB6L7.js.map
