import {Card, Container, Form, Stack} from "react-bootstrap";
import {NextPage} from "next";
import React, {useState} from "react";
import Logo from "../assets/images/Logo.svg";
import Image from "next/image";
import {useRouter} from "next/router";
import {toast} from "react-toastify";
import {useUserService} from "@/services/UserService";
import useAsyncEffect from "use-async-effect";
import {AuthCardBody} from "@/components/auth/AuthCardBody";

const LoginPage: NextPage = (props) => {
  const router = useRouter();
  const userService = useUserService();

  useAsyncEffect(async _ => {
    await userService.initialize();

    if (userService.isLoggedIn()) {
      toast.info("Already logged in, redirecting...");
      await router.push("/");
    }
  }, [])

  return (
    <>
      <Container
        className="d-flex my-4 vstack justify-content-center gap-3"
        style={{
          maxWidth: "400px"
        }}
      >
        <Card border={"primary"} bg={"dark"}>
          <Card.Body>
            <Stack>
              <Image
                src={Logo}
                alt="Logo"
                priority={true}
                className="w-100 h-auto px-3 mb-3"
              />

              <AuthCardBody/>
            </Stack>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}


export default LoginPage;