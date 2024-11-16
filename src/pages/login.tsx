import { Card, Container, Stack } from "react-bootstrap";
import { NextPage } from "next";
import React from "react";
import Logo from "../assets/images/Logo.svg";
import logo2 from "../assets/images/logo2.png";
import Image from "next/image";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useAsyncEffect from "use-async-effect";
import { AuthCardBody } from "@/components/auth/AuthCardBody";
import { useUser } from "@/hooks/useUser";
// import "../assets/styles/app.scss";
import DistribrainEngineBackgroundImage from "@/components/visual/DistribrainEngineBackgroundImage";
import { Footer } from "@/components/Footer";

const LoginPage: NextPage = (props) => {
  const router = useRouter();
  const user = useUser();

  useAsyncEffect(async _ => {
    if (user.user) {
      toast.info("Already logged in, redirecting...");
      await router.push("/");
    }
  }, [user.user])

  return (
    <>
      <DistribrainEngineBackgroundImage />
      <Container
        className="d-flex my-4 vstack justify-content-center gap-3"
        style={{
          maxWidth: "40rem",
          width: "100%",
          maxHeight: "23.813rem",
        }}
      >
        <Card className="p-4 bg-blue rounded-0 border-0"
          style={{
            boxShadow: "8px 8px 15px 0px rgba(4,11,37,0.15)",
          }}
        >
          <Card.Body>
            <Stack className="">
              <Image
                src={logo2}
                alt="StrikeBit"
                height={168}
                width={161}
                className=""
                style={{
                  width: "10.063rem",
                  objectFit: "contain",
                  height: "10.5rem",
                  margin: "auto"
                }}
              />

              <AuthCardBody />
            </Stack>
          </Card.Body>
        </Card>
      </Container>

      <Footer/>
    </>
  );
}


export default LoginPage;