import {
  Primitive
} from "./chunk-BT7JSU5K.js";
import {
  require_jsx_runtime
} from "./chunk-UZZ7CNSW.js";
import {
  require_react
} from "./chunk-QZ55VL3A.js";
import {
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/.pnpm/@radix-ui+react-visually-hidden@1.1.2_@types+react-dom@18.3.5_@types+react@18.3.18__@ty_96e5d54b7bd10cf53cadcc132d77f938/node_modules/@radix-ui/react-visually-hidden/dist/index.mjs
var React = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var NAME = "VisuallyHidden";
var VisuallyHidden = React.forwardRef(
  (props, forwardedRef) => {
    return (0, import_jsx_runtime.jsx)(
      Primitive.span,
      {
        ...props,
        ref: forwardedRef,
        style: {
          // See: https://github.com/twbs/bootstrap/blob/main/scss/mixins/_visually-hidden.scss
          position: "absolute",
          border: 0,
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          wordWrap: "normal",
          ...props.style
        }
      }
    );
  }
);
VisuallyHidden.displayName = NAME;
var Root = VisuallyHidden;

export {
  VisuallyHidden,
  Root
};
//# sourceMappingURL=chunk-EVB2AA6E.js.map
