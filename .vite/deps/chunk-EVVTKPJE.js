import {
  require_react
} from "./chunk-QZ55VL3A.js";
import {
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/@radix-ui+react-use-previous@1.1.0_@types+react@18.3.18_react@18.3.1/node_modules/@radix-ui/react-use-previous/dist/index.mjs
var React = __toESM(require_react(), 1);
function usePrevious(value) {
  const ref = React.useRef({ value, previous: value });
  return React.useMemo(() => {
    if (ref.current.value !== value) {
      ref.current.previous = ref.current.value;
      ref.current.value = value;
    }
    return ref.current.previous;
  }, [value]);
}

export {
  usePrevious
};
//# sourceMappingURL=chunk-EVVTKPJE.js.map
