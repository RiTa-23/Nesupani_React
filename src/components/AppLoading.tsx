import {
   Box,
   CircularProgress,
   Typography,
 } from "@mui/material";
 import type { SxProps, Theme } from "@mui/material";

  export type AppLoadingProps = {
    sx?: SxProps<Theme>;
    loadingSize?: string | number;
   loadingProgression?: number;
   progressVariant?: "determinate" | "indeterminate";
  };

export function AppLoading({
    sx,
    loadingSize = 100,
    loadingProgression,
    progressVariant = "determinate",
}: AppLoadingProps) {
    const enableProgress = loadingProgression != undefined;
    const value = 100 * (loadingProgression ?? 0);
    return (
        <Box
            sx={sx}
            width="100%"
            height="100%"
            color="#ffffff"
            display="flex"
            justifyContent="center"
            alignItems="center"
        >
            <CircularProgress
                size={loadingSize}
                color="inherit"
                variant={enableProgress ? progressVariant : "indeterminate"}
                value={value}
            />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography variant="caption" component="div">
                    {enableProgress ? `${Math.round(value)}%` : ""}
                </Typography>
            </Box>
        </Box>
    );
}