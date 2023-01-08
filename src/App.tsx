import "./App.css";
import { Imu } from "./components/Imu.component";
import {
  Alert,
  AlertTitle,
  Container,
  createTheme,
  CssBaseline,
  Grid,
  Paper,
  Slider,
  Snackbar,
  Stack,
  ThemeProvider,
} from "@mui/material";
import { Socket } from "socket.io-client";
import { Box } from "@mui/system";
import { Copyright, DataObject } from "@mui/icons-material";
import { Preview } from "./components/Preview.component";
import { Control } from "./components/Control";
import React, { useEffect, useState } from "react";
import { Log } from "./components/Log";
import { Startup } from "./components/Startup";
import backgroundSound from "./assets/sounds/bg.mp3";
import { useSnackbar } from "notistack";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const AppAudio = (): React.ReactElement<any, any> => {
  const audioRef = React.createRef<HTMLAudioElement>();

  useEffect(() => {
    audioRef.current!.volume = 0.2;
    audioRef.current!.play();
  }, []);

  return (
    <audio ref={audioRef} loop>
      <source src={backgroundSound} />
    </audio>
  );
};

function App({ socket }: { socket: Socket }) {
  const [authenticated, setAuthenticated] = React.useState<boolean>(false);
  const snackbar = useSnackbar();

  useEffect(() => {
    let onConnect = () => {
      snackbar.enqueueSnackbar('Connected to CPanel Middle Service!', {
        variant: 'success'
      });
    };
    let onDisconnect = () => {
      snackbar.enqueueSnackbar('Lost connection to CPanel Middle Service!', {
        variant: 'error',
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    }
  }, []);

  if (!authenticated) {
    const onReady = (): void => {
      setAuthenticated(true);
    };

    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Startup ready={onReady} />
      </ThemeProvider>
    );
  }

  return (
    <>
      <AppAudio />
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box padding={1}>
          <Stack spacing={2}>
            <Grid container spacing={2} alignItems={"center"}>
              <Grid item xs={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={7}>
                      <Imu socket={socket} />
                    </Grid>
                    <Grid item xs={5}>
                      <Preview />
                    </Grid>
                  </Grid>
              </Grid>
              <Grid item xs={4}>
                <Control />
              </Grid>
            </Grid>
            <Log />
            <Box marginTop={1}>
              <Alert
                variant={"outlined"}
                severity={"warning"}
                icon={<Copyright />}
              >
                <AlertTitle>Unicorn CPanel web-interface</AlertTitle>
                Copyright 2023 Luke A.C.A. Rieff & Rien Dumore
              </Alert>
            </Box>
          </Stack>
        </Box>
      </ThemeProvider>
    </>
  );
}

export default App;
