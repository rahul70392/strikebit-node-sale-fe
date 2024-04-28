import {useRouter} from "next/router";
import {useUserService} from "@/services/UserService";
import React, {useState} from "react";
import {toast} from "react-toastify";
import {handleBackendError} from "@/services/backend-errors/backendErrorHandling";
import {Button, Card, Form, Stack} from "react-bootstrap";
import {Formik, FormikProps} from "formik";
import {FormikFormControl} from "@/components/shared/FormikFormControl";
import OTPInput from "react-otp-input";
import {
  loginSchema, registerActivateSchema,
  registerSchema,
  requestResetPasswordSchema,
  resetPasswordSchema
} from "@/components/auth/loginValidationSchemas";
import clientApiServices from "@/services/clientApiServices";
import ButtonLoadable from "@/components/shared/ButtonLoadable";
import {defaultErrorHandler} from "@/utils/defaultErrorHandler";

interface AuthFormProps {
  loading: boolean,
  onSubmitHandler: (callback: () => Promise<void>) => Promise<void>,
  setCardState: (state: AuthCardState) => void,
}

enum AuthCardState {
  Login,
  Registration,
  RegistrationActivation,
  RequestResetPassword,
  ResetPassword
}

interface FormikOtpBlockProps<Values> {
  otp: string;
  setOtp: (otp: string) => void;
  formikProps: FormikProps<Values>;
}

function FormikOtpBlock<Values>(props: FormikOtpBlockProps<Values>) {
  const handleChange = async (otp: string) => {
    props.setOtp(otp);
    await props.formikProps.setFieldValue("otp", otp, true);
  }

  return (
    <OTPInput
      value={props.otp}
      onChange={handleChange}
      numInputs={6}
      skipDefaultStyles={true}
      inputStyle={{
        minWidth: "2.2rem",
        maxWidth: "3rem",
        textAlign: "center",
        fontSize: "1.5rem"
      }}
      containerStyle="hstack gap-1 justify-content-center"
      renderSeparator={<span>—</span>}
      renderInput={(otpInputProps, index) =>
        <Form.Control {...otpInputProps as any} />
      }
    />
  );
}

function FormIntegratedOtpBlock<Values>(props: {
  otp: string,
  setOtp: (value: (((prevState: string) => string) | string)) => void,
  formikProps: FormikProps<Values>
}) {
  return <div>
    <Form.Group>
      <Form.Label>One Time Password</Form.Label>
    </Form.Group>

    <FormikOtpBlock
      otp={props.otp}
      setOtp={props.setOtp}
      formikProps={props.formikProps}
    />

    <Form.Control.Feedback
      type="invalid"
      className={(props.formikProps.errors as any)["otp"] ? "d-block" : ""}
    >
      {(props.formikProps.errors as any)["otp"]}
    </Form.Control.Feedback>
  </div>;
}

const RegistrationForm = ({loading, onSubmitHandler, setCardState}: AuthFormProps) => {
  const handleSubmit = async (values: any) => {
    await onSubmitHandler(async () => {
      try {
        await clientApiServices.dropletAuthApi.authControllerSignup({
          email: values.email,
          password: values.password,
          lang: "en"
        });
        toast.success("Registration successful, please check your inbox for OTP confirmation email.");

        setCardState(AuthCardState.RegistrationActivation);
      } catch (err: any) {
        defaultErrorHandler(err);
      }
    })
  }

  return <>
    <Card.Title>Create Account</Card.Title>

    <Formik
      validationSchema={registerSchema}
      onSubmit={handleSubmit}
      initialValues={{
        email: "",
        password: "",
        passwordConfirmation: "",
      }}
    >
      {formikProps =>
        (
          <Form noValidate onSubmit={formikProps.handleSubmit}>
            <Stack gap={3}>
              <FormikFormControl
                name="email"
                formikProps={formikProps}
                formControlProps={{
                  type: "email",
                  autoComplete: "email",
                  placeholder: "Email"
                }}
              />

              <FormikFormControl
                name="password"
                formikProps={formikProps}
                formControlProps={{
                  type: "password",
                  autoComplete: "new-password",
                  placeholder: "Password"
                }}
              />

              <FormikFormControl
                name="passwordConfirmation"
                formikProps={formikProps}
                formControlProps={{
                  type: "password",
                  autoComplete: "new-password",
                  placeholder: "Confirm Password"
                }}
              />

              <ButtonLoadable
                type="submit"
                className="mt-2 w-100 py-3 lead d-flex align-items-center justify-content-center"
                loading={loading}
                disabled={loading}
              >
                Create Account
              </ButtonLoadable>
            </Stack>
          </Form>
        )}
    </Formik>

    <Stack gap={3} className="font-weight-light mt-2">
      <Button
        variant=""
        className="p-0 btn-link d-block text-muted text-end"
        onClick={() => setCardState(AuthCardState.Login)}
      >
        Login
      </Button>
    </Stack>
  </>
}

const RegistrationActivationForm = ({loading, onSubmitHandler, setCardState}: AuthFormProps) => {
  const [otp, setOtp] = useState("");

  const handleSubmit = async (values: any) => {
    await onSubmitHandler(async () => {
      try {
        await clientApiServices.dropletAuthApi.authControllerActivateUser({
          otp: parseInt(otp)
        });
        toast.success("Account activation successful! You can now log in.");

        setCardState(AuthCardState.Login);
      } catch (err: any) {
        console.error(err);
        toast.error("Account activation failed, please try again.");
      }
    })
  }

  return <>
    <Card.Title>Confirm Account</Card.Title>

    <Formik
      validationSchema={registerActivateSchema}
      onSubmit={handleSubmit}
      initialValues={{
        otp: "",
      }}
    >
      {formikProps =>
        (
          <Form noValidate onSubmit={formikProps.handleSubmit}>
            <Stack gap={3}>
              <p>
                A One-Time Password has been sent to your email to your email, and the new password.
                Please allow a few minutes for the email to arrive.
              </p>

              <FormIntegratedOtpBlock
                otp={otp}
                setOtp={setOtp}
                formikProps={formikProps}
              />

              <ButtonLoadable
                type="submit"
                className="mt-2 w-100 py-3 lead d-flex align-items-center justify-content-center"
                loading={loading}
                disabled={loading}
              >
                Verify OTP
              </ButtonLoadable>
            </Stack>
          </Form>
        )}
    </Formik>

    <Stack gap={3} className="font-weight-light mt-2">
      <Button
        variant=""
        className="p-0 btn-link d-block text-muted text-end"
        onClick={() => setCardState(AuthCardState.Login)}
      >
        Login
      </Button>
    </Stack>
  </>
}

const RequestResetPasswordForm = ({loading, onSubmitHandler, setCardState}: AuthFormProps) => {
  const handleSubmit = async (values: any) => {
    await onSubmitHandler(async () => {
      try {
        await clientApiServices.dropletAuthApi.authControllerRequestPasswordReset({
          email: values.email
        });
        toast.success("Password reset email sent, check your inbox for instructions!");
        await new Promise(r => setTimeout(r, 1000));

        setCardState(AuthCardState.ResetPassword);
      } catch (err: any) {
        console.error(err);
        toast.error("Password reset request failed, please try again.");
      }
    })
  }

  return <>
    <Card.Title>Forgot Password</Card.Title>

    <Formik
      validationSchema={requestResetPasswordSchema}
      onSubmit={handleSubmit}
      initialValues={{
        email: "",
      }}
    >
      {formikProps =>
        (
          <Form noValidate onSubmit={formikProps.handleSubmit}>
            <Stack gap={3}>
              <FormikFormControl
                name="email"
                formikProps={formikProps}
                formControlProps={{
                  type: "email",
                  autoComplete: "email",
                  placeholder: "Email"
                }}
              />

              <ButtonLoadable
                type="submit"
                className="mt-2 w-100 py-3 lead d-flex align-items-center justify-content-center"
                loading={loading}
                disabled={loading}
              >
                Send Password Reset OTP
              </ButtonLoadable>
            </Stack>
          </Form>
        )}
    </Formik>

    <Stack gap={3} className="font-weight-light mt-2">
      <Button
        variant=""
        className="p-0 btn-link d-block text-muted text-end"
        onClick={() => setCardState(AuthCardState.Login)}
      >
        Login
      </Button>
    </Stack>
  </>
}

const ResetPasswordForm = ({loading, onSubmitHandler, setCardState}: AuthFormProps) => {
  const [otp, setOtp] = useState("");

  const handleSubmit = async (values: any) => {
    await onSubmitHandler(async () => {
      try {
        await clientApiServices.dropletAuthApi.authControllerResetPassword({
          password: values.password,
          otp: otp
        });
        toast.success("Password reset successful! You can now log in.");

        setCardState(AuthCardState.Login);
      } catch (err: any) {
        console.error(err);
        toast.error("Password reset failed, please try again.");
      }
    })
  }

  return <>
    <Card.Title>Confirm New Password</Card.Title>

    <Formik
      validationSchema={resetPasswordSchema}
      onSubmit={handleSubmit}
      initialValues={{
        otp: "",
        password: "",
        passwordConfirmation: "",
      }}
    >
      {formikProps =>
        (
          <Form noValidate onSubmit={formikProps.handleSubmit}>
            <Stack gap={3}>
              <p>
                Please enter the One-Time Password you got in your email, and the new password.
                It might take a few minutes for the email to arrive.
              </p>

              <FormIntegratedOtpBlock
                otp={otp}
                setOtp={setOtp}
                formikProps={formikProps}
              />

              <FormikFormControl
                name="password"
                formikProps={formikProps}
                formControlProps={{
                  type: "password",
                  autoComplete: "new-password",
                  placeholder: "New Password"
                }}
              />

              <FormikFormControl
                name="passwordConfirmation"
                formikProps={formikProps}
                formControlProps={{
                  type: "password",
                  autoComplete: "new-password",
                  placeholder: "Confirm New Password"
                }}
              />

              <ButtonLoadable
                type="submit"
                className="mt-2 w-100 py-3 lead d-flex align-items-center justify-content-center"
                loading={loading}
                disabled={loading}
              >
                Reset Password
              </ButtonLoadable>
            </Stack>
          </Form>
        )}
    </Formik>

    <Stack gap={3} className="font-weight-light mt-2">
      <Button
        variant=""
        className="p-0 btn-link d-block text-muted text-end"
        onClick={() => setCardState(AuthCardState.Login)}
      >
      Login
      </Button>
    </Stack>
  </>
}

const LoginForm = ({loading, onSubmitHandler, setCardState}: AuthFormProps) => {
  const router = useRouter();
  const userService = useUserService();

  const handleSubmit = async (values: any) => {
    await onSubmitHandler(async () => {
      try {
        const authData = await userService.login(values.email, values.password);
        if (!authData.user.emailVerified) {
          toast.error("Email not yet confirmed, please check your inbox.");
          return;
        }

        //setIsLoggedIn(true);

        /*router.events.on('routeChangeStart', _ => {
          router.events.emit('routeChangeError', '', '', {shallow: false});
          // eslint-disable-next-line no-throw-literal
          throw ' 👍 Abort route change due to unsaved changes in form. Triggered by useNavigationObserver. Please ignore this error.'
        })*/

        toast.success(`Welcome, ${userService.getUserName()}!`);

        await router.push("/");
      } catch (err: any) {
        defaultErrorHandler(err);
      }
    })
  }

  return <>
    <Card.Title>Sign In</Card.Title>

    <Formik
      validationSchema={loginSchema}
      onSubmit={handleSubmit}
      initialValues={{
        email: "",
        password: "",
      }}
    >
      {formikProps =>
        (
          <Form noValidate onSubmit={formikProps.handleSubmit}>
            <Stack gap={3}>
              <FormikFormControl
                name="email"
                formikProps={formikProps}
                formControlProps={{
                  type: "email",
                  autoComplete: "email",
                  placeholder: "Email"
                }}
              />

              <FormikFormControl
                name="password"
                formikProps={formikProps}
                formControlProps={{
                  type: "password",
                  autoComplete: "password",
                  placeholder: "Password"
                }}
              />

              <ButtonLoadable
                type="submit"
                className="mt-2 w-100 py-3 lead d-flex align-items-center justify-content-center"
                loading={loading}
                disabled={loading}
              >
                Sign In
              </ButtonLoadable>
            </Stack>
          </Form>
        )}
    </Formik>

    <Stack gap={3} className="font-weight-light mt-2">
      <Button
        variant=""
        className="p-0 btn-link d-block text-muted text-end"
        onClick={() => setCardState(AuthCardState.RequestResetPassword)}
      >
        Forgot Password?
      </Button>

      <Stack gap={3} className="flex-grow-0 font-weight-light text-uppercase align-items-center">
        <Button
          variant=""
          className="p-0 btn-link d-block fw-bold text-muted text-end"
          onClick={() => setCardState(AuthCardState.Registration)}
        >
          Create an account
        </Button>
      </Stack>
    </Stack>
  </>
}

export const AuthCardBody = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState(AuthCardState.Login);

  const handleSubmit = async (callback: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await callback();
    } finally {
      setIsLoading(false);
    }
  }

  return <>
    {
      (() => {
        switch (state) {
          case AuthCardState.Login:
            return <LoginForm
              loading={isLoading}
              onSubmitHandler={handleSubmit}
              setCardState={setState}
            />
          case AuthCardState.Registration:
            return <RegistrationForm
              loading={isLoading}
              onSubmitHandler={handleSubmit}
              setCardState={setState}
            />
          case AuthCardState.RegistrationActivation:
            return <RegistrationActivationForm
              loading={isLoading}
              onSubmitHandler={handleSubmit}
              setCardState={setState}
            />
          case AuthCardState.RequestResetPassword:
            return <RequestResetPasswordForm
              loading={isLoading}
              onSubmitHandler={handleSubmit}
              setCardState={setState}
            />
          case AuthCardState.ResetPassword:
            return <ResetPasswordForm
              loading={isLoading}
              onSubmitHandler={handleSubmit}
              setCardState={setState}
            />
        }
      })()
    }
  </>
}