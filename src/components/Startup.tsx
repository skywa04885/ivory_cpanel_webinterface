import { Fingerprint, PlayArrowSharp } from "@mui/icons-material";
import {
  Alert,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import _ from "lodash";
import React, { useEffect } from "react";
import { sleep } from "../helpers/general";

import startupSound from '../assets/sounds/startup.mp3';
import useSound from "use-sound";

export const StartupLoader = (): React.ReactElement<any, any> => {
  return (
    <Box width={300}>
      <Typography variant={"overline"}>Voorbereiden ...</Typography>
      <LinearProgress color="warning" />
    </Box>
  );
};

export interface StartupButtonProps {
  next: () => void,
}

export const StartupButton = ({ next }: StartupButtonProps): React.ReactElement<any, any> => {
  const [passphrase, setPassphrase] = React.useState<string>("");

  const onFingerPrintClick = async (): Promise<void> => {
    let finalPassphrase: string = "Gay nigga";

    for (let i = 0; i < finalPassphrase.length; ++i) {
      setPassphrase(finalPassphrase.slice(0, i));
      await sleep(_.random(20.0, 160.0));
    }

    next();
  };

  return (
    <Paper variant="outlined">
      <Box padding={2}>
        <Stack spacing={1}>
          <Alert variant="outlined" severity="warning">
            Verboden voor onbevoegden.
          </Alert>
          <Stack direction={"row"} spacing={1} alignItems={"center"}>
            <TextField
              size={"small"}
              type={"password"}
              value={passphrase}
              variant="outlined"
              color="warning"
            />
            <IconButton
              onClick={onFingerPrintClick}
              size="large"
              color="warning"
            >
              <Fingerprint fontSize="large" />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export interface StartupProps {
  ready: () => void,
}

export const Startup = ({ ready}: StartupProps): React.ReactElement<any, any> => {
  const [playStartupSound] = useSound(startupSound);

  const [loading, setLoading] = React.useState<boolean>(false);

  const onNext = async (): Promise<void> => {
    playStartupSound();
    setLoading(true);

    await sleep(3000);

    ready();
  };

  const getChild = () => {
    if (loading) {
      return <StartupLoader />;
    }

    return <StartupButton next={onNext}/>
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {getChild()}
    </Box>
  );
};
