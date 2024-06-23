import {Container, Stack} from "react-bootstrap";
import DropletEngineBackgroundImage from "@/components/visual/DropletEngineBackgroundImage";
import React from "react";
import {GenericConfirmationDialogProvider} from "@/components/dialogs/GenericConfirmationDialog";
import {routes} from "@/data/routes";
import {Web3WalletProvider} from "@/providers/web3/Web3WalletProvider";

export const MainLayout = ({children}: { children: React.ReactNode }) => {
  return <>
    <Container as="main">
      <DropletEngineBackgroundImage/>

      <Web3WalletProvider>
        <GenericConfirmationDialogProvider>
          {children}
        </GenericConfirmationDialogProvider>
      </Web3WalletProvider>

      <Stack gap={3} className="flex-grow-0 my-4 font-weight-light align-items-center">
        <Stack gap={3} className="flex-grow-0 align-self-center align-items-center flex-column flex-sm-row">
          <a href={routes.legal.privacyPolicy()}
             target="_blank"
             rel="noreferrer"
          >
            Privacy Policy
          </a>

          <a href={routes.legal.termsAndConditions()}
             target="_blank"
             rel="noreferrer"
          >
            Terms and Conditions
          </a>
        </Stack>

        <span>© {new Date().getUTCFullYear()} DistriBrain</span>
      </Stack>
    </Container>
  </>;
}