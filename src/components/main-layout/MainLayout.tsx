import { Container, Stack } from "react-bootstrap";
import { UserProvider as Auth0UserProvider } from "@auth0/nextjs-auth0/client";
import DistribrainEngineBackgroundImage from "@/components/visual/DistribrainEngineBackgroundImage";
import React, { useEffect, useState } from "react";
import { GenericConfirmationDialogProvider } from "@/components/dialogs/GenericConfirmationDialog";
import { routes } from "@/data/routes";
import { Web3WalletProvider } from "@/providers/web3/Web3WalletProvider";
import { UserProvider } from "@/services/UserProvider";
import Bowser from "bowser";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [extraMainClass, setExtraMainClass] = useState("");
  useEffect(() => {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const isAndroidChrome = browser.satisfies({
      android: {
        "chrome": ">= 1"
      }
    });

    if (isAndroidChrome) {
      setExtraMainClass("device-android-chrome")
    }
  }, []);

  return <>
    <Container as="main" className={extraMainClass} style={{
      padding: 0
    }}>
      {/* <DistribrainEngineBackgroundImage/> */}

      <Auth0UserProvider>
        <UserProvider isActive={true}>
          <Web3WalletProvider>
            <GenericConfirmationDialogProvider>
              {children}
            </GenericConfirmationDialogProvider>
          </Web3WalletProvider>
        </UserProvider>
      </Auth0UserProvider>


      <section className='m-top'
        style={{
          position: "relative",
          marginBottom: "5rem",
          top: "2rem"
        }}
      >
        <div className=''
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "3rem"
          }}
        >
          <div className=''
            style={{
              display: "flex",
              justifyContent: "space-evenly"
            }}
          >
            <div>Privacy Policy</div>
            <div>Terms and Condition</div>
            <div>Support</div>
          </div>
          <div className=''
            style={{
              textAlign: "center"
            }}
          >
            © 2024 StrikeBit
          </div>
        </div>
      </section>

      {/* <Stack gap={3} className="flex-grow-0 my-4 font-weight-light align-items-center">
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

          <a href={routes.legal.support()}
            target="_blank"
            rel="noreferrer"
          >
            Support
          </a>
        </Stack>

        <span>© {new Date().getUTCFullYear()} StrikeBit</span>
      </Stack> */}
    </Container>
  </>;
}