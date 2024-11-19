import React, { FC, ReactNode } from "react";
import { Button, CircularProgress, ButtonProps } from "@mui/material";

interface ButtonLoadableProps extends Omit<ButtonProps, 'variant'> {
  children: ReactNode;
  loading: boolean;
  loadingChildren?: ReactNode;
  variant?: "text" | "contained" | "outlined";
}

export const ButtonLoadable: FC<ButtonLoadableProps> = ({
  children,
  loading,
  loadingChildren,
  ...props
}) => {
  return (
    <Button
      {...props}
      sx={{
        backgroundColor: "white",
        color: "#1214FD",
        padding: "1rem 0",
        borderRadius: 0,
        '&.Mui-disabled': {
          color: "gray"
        }
      }}
    >
      {loading ? (
        <>
          <CircularProgress size={24} style={{ marginRight: "0.75rem" }} />
          <span>{loadingChildren ?? children}</span>
        </>
      ) : (
        <span>{children}</span>
      )}
    </Button>
  );
};

export default ButtonLoadable;

// import React, { FC, ReactNode } from "react";
// import { Button, ButtonProps, Spinner } from "react-bootstrap";

// interface ButtonLoadableProps extends ButtonProps {
//   children: ReactNode;
//   loading: boolean;
//   loadingChildren?: ReactNode;
// }

// export const ButtonLoadable: FC<ButtonLoadableProps> = ({ children, loading, loadingChildren, ...props }) => {
//   return (
//     <Button {...props}>
//       {loading && (
//         <Spinner
//           style={{
//             marginTop: 0,
//             marginRight: "0.75rem",
//             // @ts-ignore
//             "--bs-spinner-width": "1.2rem",
//             "--bs-spinner-height": "1.2rem",
//             "--bs-spinner-border-width": "0.2rem",
//           }}
//         />
//       )}

//       <span>
//         {!loading && children}

//         {loading && (loadingChildren ?? children)}
//       </span>
//     </Button>
//   );
// };

// export default ButtonLoadable;