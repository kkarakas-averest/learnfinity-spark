import {
  useLayoutEffect2
} from "./chunk-LHQPB6L7.js";
import {
  require_react
} from "./chunk-QZ55VL3A.js";
import {
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/@radix-ui+react-id@1.1.0_@types+react@18.3.18_react@18.3.1/node_modules/@radix-ui/react-id/dist/index.mjs
var React = __toESM(require_react(), 1);
var useReactId = React["useId".toString()] || (() => void 0);
var count = 0;
function useId(deterministicId) {
  const [id, setId] = React.useState(useReactId());
  useLayoutEffect2(() => {
    if (!deterministicId) setId((reactId) => reactId ?? String(count++));
  }, [deterministicId]);
  return deterministicId || (id ? `radix-${id}` : "");
}

export {
  useId
};
//# sourceMappingURL=chunk-7OAABNPR.js.map
