

  import { Box, CircularProgress, Typography } from "@mui/material";

  import logo from "../assets/logo/EARIST_Logo.png";


  const LoadingOverlay = ({ open, message = "Loading, please wait..." }) => {
    
    if (!open) {
      return null;
    }

    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          bgcolor: "rgba(255, 248, 225, 0.95)", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999, 
          flexDirection: "column",
        }}
      >
        {}
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress
            size={120}
            thickness={3}
            sx={{
              color: "#A31D1D", 
              animationDuration: "800ms",
            }}
          />

          {}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 70,
              height: 70,
              borderRadius: "50%",
              bgcolor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(163, 29, 29, 0.5)",
              animation: "heartbeat 1.5s ease-in-out infinite",
            }}
          >
            {}
            <Box
              component="img"
              src={logo}
              alt="EARIST Logo"
              sx={{
                width: "90%", 
                height: "90%",
                objectFit: "contain", 
              }}
            />
          </Box>
        </Box>

        {}
        <Typography
          variant="h6"
          sx={{
            mt: 3,
            color: "#A31D1D",
            fontWeight: "bold",
            animation: "pulse 1.5s infinite",
          }}
        >
          {message}
        </Typography>

        {}
        <style>
          {`
            @keyframes heartbeat {
              0% { transform: translate(-50%, -50%) scale(1); }
              25% { transform: translate(-50%, -50%) scale(1.1); }
              50% { transform: translate(-50%, -50%) scale(1); }
              75% { transform: translate(-50%, -50%) scale(1.1); }
              100% { transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.6; }
              100% { opacity: 1; }
            }
          `}
        </style>
      </Box>
    );
  };

  export default LoadingOverlay;