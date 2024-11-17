import { Badge, Button, Card, Col, Container, Row, Spinner, Stack } from "react-bootstrap";
import { NextPage } from "next";
import React, { SyntheticEvent, useEffect, useState } from "react";
import Logo from "../assets/images/Logo.svg";
import logo2 from "../assets/images/logo2.png"
import Image from "next/image";
import { useRouter } from "next/router";
import useAsyncEffect from "use-async-effect";
import { MdLink, MdOutlineContentCopy, MdOutlineHistory } from "react-icons/md";
import { BiMoneyWithdraw } from "react-icons/bi";
import { TbLink, TbShare2 } from "react-icons/tb";
import { basicRemoteDataFetcherFn } from "@/utils/basicRemoteDataFetcher";
import clientApiServices from "@/services/clientApiServices";
import {
  NodesInformationDto,
  UserMyReferralCodeResponseDto,
  UserNodesAccountPurchaseNodeSummaryDto,
  UserNodesAccountSummaryDto
} from "@/generated/distribrain-nodes-api";
import { formatTokenAmountUI } from "@/utils/formatTokenAmountUI";
import { uiIntNumberNiceFormat, uiPercentageNumberNiceFormat } from "@/utils/uiNiceFormat";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import noCacheHeaders from "@/utils/noCacheHeaders";
import { StarIcon } from "@/components/visual/StarIcon";
import { PurchaseNodesDialog } from "@/components/dialogs/PurchaseNodesDialog/PurchaseNodesDialog";
import { routes } from "@/data/routes";
import { defaultErrorHandler } from "@/utils/defaultErrorHandler";
import { useNodesReferralPurchasesHistoryDialog } from "@/hooks/dialogs/useNodesReferralPurchasesHistoryDialog";
import { useWithdrawNodesReferralRewardsDialog } from "@/hooks/dialogs/useWithdrawNodesReferralRewardsDialog";
import { useWithdrawNodesHoldingRewardsDialog } from "@/hooks/dialogs/useWithdrawNodesHoldingRewardsDialog";
import { useWithdrawDePinKeyPurchaseRewardsDialog } from "@/hooks/dialogs/useWithdrawDePinKeyPurchaseRewardsDialog";
import commonTerms from "@/data/commonTerms";
import { useUser } from "@/hooks/useUser";
import { FiLogOut } from "react-icons/fi";
import useReferralCodeFromQuery from "@/hooks/useReferralCodeFromQuery";

import { Navbar } from "@/components/nav/Navbar";
import { Copy, Share2 } from 'lucide-react';
// import Button from '@mui/material/Button';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Footer } from "@/components/Footer";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const HomePageBody = (
  {
    referralCode,
    userNodesSummary,
    nodesInformation,
    refetchData,
    onViewReferralPurchasesHistoryClicked,
    onWithdrawReferralRewardsClicked,
    onWithdrawHoldingRewardsClicked,
    onWithdrawDePinKeyPurchaseRewardsClicked
  }: {
    referralCode: UserMyReferralCodeResponseDto;
    userNodesSummary: UserNodesAccountSummaryDto;
    nodesInformation: NodesInformationDto;
    refetchData: () => Promise<void>;
    onViewReferralPurchasesHistoryClicked: () => void;
    onWithdrawReferralRewardsClicked: () => void;
    onWithdrawHoldingRewardsClicked: () => void;
    onWithdrawDePinKeyPurchaseRewardsClicked: () => void;
  }
) => {
  const router = useRouter();
  const user = useUser();
  const referralCodeFromQuery = useReferralCodeFromQuery();
  const [showNodePurchaseDialog, setShowNodePurchaseDialog] = useState(false);
  const [selectedNodeTypeId, setSelectedNodeTypeId] = useState(nodesInformation.nodeTypes[0].id);
  const [openCopyToast, setOpenCopyToast] = useState<boolean>(false);

  const canWithdrawHoldingRewards =
    BigInt(userNodesSummary.totalHoldingRewardBalanceTokenAmount) > 0;

  const canWithdrawDePinKeyPurchaseRewards =
    BigInt(userNodesSummary.totalDePinKeyPurchaseRewardAvailableTokenAmount) > 1_000n; // ignore dust

  const formatHoldingTokenAmount = (amount: bigint) =>
    formatTokenAmountUI(amount, nodesInformation?.holdingRewardErc20Token?.decimals!, 1);

  const formatReferralTokenAmount = (amount: bigint) =>
    formatTokenAmountUI(amount, nodesInformation?.referralRewardErc20Token?.decimals!, 2);

  const formatDePinKeyPurchaseRewardTokenAmount = (amount: bigint) =>
    formatTokenAmountUI(amount, nodesInformation?.dePinKeyPurchaseRewardErc20Token?.exponent!, 2);

  const getUserNodeTypeInfo = (nodeTypeId: number) => {
    const info = userNodesSummary.totalPurchasedNodesCount.find(x => x.nodeTypeId === nodeTypeId);
    if (!info) {
      return {
        nodeTypeId: nodeTypeId,
        count: 0,
      } as UserNodesAccountPurchaseNodeSummaryDto;
    }
    return info;
  };

  const onNodePurchased = async () => {
    await refetchData();
    setShowNodePurchaseDialog(false);
  }

  const onLogoutClicked = async () => {
    toast.info("Signing out...");
    await router.push(routes.auth.logout());
  }

  // const handleCloseCopyToast = (
  //   event?: SyntheticEvent,
  //   reason?: SnackbarCloseReason,
  // ) => {
  //   if (reason === 'clickaway') {
  //     return;
  //   }

  //   setOpenCopyToast(false);
  // };

  return <div>
    <Navbar />
    {/* <Container
      className="d-flex w-auto mb-2 flex-column flex-sm-row align-items-center gap-3"
      style={{
        minHeight: "2.9rem"
      }}
    >
      <span
        className="d-flex h-100 px-3 py-2 align-items-center border-2 border- border-info rounded-pill"
        style={{
          border: "solid"
        }}
      >
        {user.user!.picture && (
          <Image
            src={user.user!.picture!}
            alt="Avatar"
            width={100}
            height={100}
            unoptimized
            className="rounded-circle"
            style={{
              width: "2rem",
              height: "2rem",
              marginLeft: "-0.5rem",
              marginRight: "0.5rem",
            }}
          />
        )}

        {user.user!.userDisplayName}
      </span>

      <Button
        variant="outline-info"
        className="d-flex h-100 px-3 py-2 align-items-center rounded-pill no-primary-gradient"
        onClick={() => onLogoutClicked()}
      >
        <span className="d-flex fs-4 me-2"><FiLogOut /></span> Sign Out
      </Button>
    </Container> */}

    <section className="m-top">
      <div className="bg-blue d-flex flex-column justify-content-evenly align-items-center p-3 p-md-5 flex-md-row flex-wrap gap-5 gap-md-3"
        style={{
          // padding: "4rem",
          // display: "grid",
          // gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
        }}
      >
        <div className="d-flex flex-column col-12 col-lg-4"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem"
          }}
        >
          <h2 className="text-big">
            Your Personal Referral Code:
          </h2>
          <div
            className="bg-white d-flex justify-content-between align-items-center"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.5rem 1rem",
              maxWidth: "18rem"
            }}
          >
            <div
              className="text-blue text-mid"
              style={{ fontWeight: 700 }}
            >
              {user.user?.referralCode}
            </div>

            <div className="d-flex align-items-center justify-content-center"
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CopyToClipboard
                text={referralCode.code}
                onCopy={() => toast.info("Referral code copied!", { autoClose: 1500 })}
              >
                <button title="Copy referral code" className="bg-white border-0">
                  <Copy size={24} color="#1214FD" />
                </button>
              </CopyToClipboard>
              <CopyToClipboard
                text={routes.referralLink(referralCode.code)}
                onCopy={() => toast.info("Referral link copied!", { autoClose: 1500 })}
              >
                <button title="Copy referral link" className="bg-white border-0">
                  <Share2 size={24} color="#1214FD" />
                </button>
              </CopyToClipboard>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center px-0 px-lg-3"
          style={{
            display: "flex",
            alignItems: "end",
            padding: "0 3rem"
          }}
        >
          <Image
            src="/google.svg"
            alt="Google"
            height={56}
            width={56}
          />
          <div className=""
            style={{
              padding: "0 1rem",
              textWrap: "wrap"
            }}
          >
            <p className="text-small">Google ID</p>
            <p className=""
              style={{
                fontWeight: 700,
                fontSize: "20px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "16rem"
              }}
            >
              {user?.user?.email}
            </p>
          </div>
        </div>

        <Footer />
        {/* <div className="d-flex justify-content-center justify-content-md-end"
          style={{
            display: "flex",
            justifyContent: "end",
            flexGrow: "1"
          }}
        >
          <button className="bg-gray text-mid h-full py-3 px-4"
            style={{
              height: "100%",
              padding: "0 2rem",
              border: "none"
            }}
          >
            Free Plan
          </button>
        </div> */}
      </div>
    </section>

    <section className='m-top'>
      <div
        className='text-big bg-dark-gray py-4 px-8 px-lg-12 d-flex flex-column flex-lg-row gap-5 justify-content-center justify-content-lg-between align-items-center'
        style={{
          padding: "1rem 3rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <p className="text-center">Total <span className='text-green'>{uiIntNumberNiceFormat(nodesInformation.purchaseInfo.globalPurchasedAllNodesCount)}</span> Radiant Nodes sold.</p>
      </div>
    </section>

    <section className='m-top'
      style={{
        position: "relative",
      }}
    >
      <Image
        src="/bg-shadow-1.svg"
        alt=''
        width={1334.08}
        height={1327.82}
        style={{
          position: "absolute",
          zIndex: "-5",
          top: "-40%",
          left: "-10%"
        }}
      />
      <div className='bg-dark-gray'
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "3rem 1rem",
          gap: "4rem"
        }}
      >
        <h2 className='text-heading text-center'>Radiant Node Referrals</h2>

        <div className='d-flex flex-column flex-lg-row flex-wrap gap-5'
          style={{
            display: "flex",
            gap: "2rem"
          }}
        >
          <div className=''
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem",
              justifyContent: "space-between"
            }}
          >
            <h2 className="text-bigger" style={{ fontWeight: 400 }}>CORE</h2>
            <Image
              src="/core.svg"
              alt='CORE'
              height={360}
              width={362.67}
            />
            <p style={{ fontWeight: 700 }}>$299 USD</p>
            <ul className=''
              style={{
                listStyleType: "disc",
                marginLeft: "-25px"
              }}
            >
              <li>1,000,000 rStrike / 30 days</li>
              <li>1 year membership</li>
            </ul>
            {/* <button
              className='white-btn'
              style={{
                border: 0
              }}
              onClick={() => setShowNodePurchaseDialog(true)}
              disabled={nodesInformation.featureFlags.purchasingDisabled}
            >
              BUY CORE
            </button> */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      return (
                        <button onClick={() => {
                          openConnectModal()
                          setSelectedNodeTypeId(commonTerms.nodeTypeCoreId);
                          setShowNodePurchaseDialog(true);
                        }} type="button"
                          style={{
                            border: "0",
                            width: "10rem",
                            padding: "1rem",
                            color: "#1214FD",
                            backgroundColor: "white",
                            fontWeight: 700
                          }}
                        >
                          BUY CORE
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
          <div className=''
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem",
              justifyContent: "space-between"
            }}
          >
            <h2 className="text-bigger" style={{ fontWeight: 400 }}>PRIME</h2>
            <Image
              src="/prime.svg"
              alt='PRIME'
              height={360}
              width={362.67}
            />
            <p style={{ fontWeight: 700 }}>$499 USD</p>
            <ul className=''
              style={{
                listStyleType: "disc",
                marginLeft: "-25px"
              }}
            >
              <li>2,500,000 rStrike / 30 days</li>
              <li>5 years Membership</li>
            </ul>
            {/* <button
              className='white-btn'
              style={{
                border: 0
              }}
              onClick={() => setShowNodePurchaseDialog(true)}
              disabled={nodesInformation.featureFlags.purchasingDisabled}
            >
              BUY PRIME
            </button> */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      return (
                        <button onClick={() => {
                          openConnectModal()
                          setSelectedNodeTypeId(commonTerms.nodeTypePrimeId);
                          setShowNodePurchaseDialog(true);
                        }} type="button"
                          style={{
                            border: "0",
                            width: "10rem",
                            padding: "1rem",
                            color: "#1214FD",
                            backgroundColor: "white",
                            fontWeight: 700
                          }}
                        >
                          BUY PRIME
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
          <div className=''
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem",
              justifyContent: "space-between"
            }}
          >
            <h2 className="text-bigger" style={{ fontWeight: 400 }}>ELITE</h2>
            <Image
              src="/elite.svg"
              alt='ELITE'
              height={360}
              width={362.67}
            />
            <p style={{ fontWeight: 700 }}>$699 USD</p>
            <ul className=''
              style={{
                listStyleType: "disc",
                marginLeft: "-25px"
              }}
            >
              <li>4,000,000 rStrike / 30 days</li>
              <li>5M Strike Tokens Reward Pool</li>
              <li>20% Vates Rev. Share</li>
              <li>Lifetime Membership</li>
            </ul>
            {/* <button
              className='white-btn'
              style={{
                border: 0
              }}
              onClick={() => setShowNodePurchaseDialog(true)}
              disabled={nodesInformation.featureFlags.purchasingDisabled}
            >
              BUY ELITE
            </button> */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      return (
                        <button onClick={() => {
                          openConnectModal();
                          setSelectedNodeTypeId(commonTerms.nodeTypeEliteId);
                          setShowNodePurchaseDialog(true);
                        }} type="button"
                          style={{
                            border: "0",
                            width: "10rem",
                            padding: "1rem",
                            color: "#1214FD",
                            backgroundColor: "white",
                            fontWeight: 700
                          }}
                        >
                          BUY ELITE
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </section>

    <section className='m-top relative'
      style={{
        position: "relative",
        marginBottom: "12rem"
      }}
    >
      <div className='bg-dark-gray padding-x'
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4rem",
          paddingTop: "3rem",
          paddingBottom: "3rem"
        }}
      >
        <h2 className='text-heading text-center'>My Holdings</h2>

        <div className=''
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "4rem"
          }}
        >
          <div className='d-flex flex-column flex-md-row gap-5 gap-md-0'
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 3rem"
            }}
          >
            <div className=''
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <p className='text-big'
                style={{
                  color: "rgba(255,255,255,0.7)"
                }}
              >CORE</p>
              <p className='text-heading'>{getUserNodeTypeInfo(commonTerms.nodeTypeCoreId).count}</p>
            </div>
            <div className=''
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <p className='text-big'
                style={{
                  color: "rgba(255,255,255,0.7)"
                }}
              >PRIME</p>
              <p className='text-heading'>{getUserNodeTypeInfo(commonTerms.nodeTypePrimeId).count}</p>
            </div>
            <div className=''
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <p className='text-big'
                style={{
                  color: "rgba(255,255,255,0.7)"
                }}
              >ELITE</p>
              <p className='text-heading'>{getUserNodeTypeInfo(commonTerms.nodeTypeEliteId).count}</p>
            </div>
          </div>
          <div className='d-flex flex-column flex-md-row gap-5 gap-md-0'
            style={{
              display: "flex",
              justifyContent: "space-evenly"
            }}
          >
            <div className=''
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <p className='text-big'
                style={{
                  color: "rgba(255,255,255,0.7)"
                }}
              >rStrike</p>
              <p className='text-heading'>{formatHoldingTokenAmount(BigInt(userNodesSummary.totalHoldingRewardVestedTokenAmount))}</p>
              <button className='blue-btn'
                style={{
                  border: 0
                }}
                onClick={() => onWithdrawHoldingRewardsClicked()}
              >
                CLAIM
              </button>
            </div>
            <div className=''
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              <p className='text-big'
                style={{
                  color: "rgba(255,255,255,0.7)"
                }}
              >USDT</p>
              <p className='text-heading'>{formatReferralTokenAmount(BigInt(userNodesSummary?.totalReferralRewardAvailableTokenAmount))}</p>
              <button className='blue-btn'
                style={{
                  border: 0
                }}
                onClick={() => onWithdrawReferralRewardsClicked()}
              >
                WITHDRAW
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Image
      src="/bg-shadow-2.svg"
      alt=""
      height={1327.82}
      width={1334.08}
      className=""
      style={{
        position: "absolute",
        zIndex: "-5",
        bottom: "-15rem",
        right: "-25%"
      }}
    />

    {/* <Container className="h1 p-0 text-center">
      Total <Badge bg="primary" pill>
        {uiIntNumberNiceFormat(nodesInformation.purchaseInfo.globalPurchasedAllNodesCount)}
      </Badge> StrikeBit Engines Sold
    </Container>

    <Container className="h1 p-0 text-center">
      Total <Badge bg="primary" pill>
        {uiIntNumberNiceFormat(nodesInformation.purchaseInfo.globalPurchasedDePinKeysCount)}
      </Badge> DePIN Keys Sold
    </Container> */}

    {/* <Container className="h1 m-0 text-center position-relative">
      <div className="animated-edge-button-wrapper">
        <Button
          variant="primary"
          className="p-3 px-lg-4 fs-3 fw-medium flex-fill flex-lg-grow-0 animated-edge-button btn-primary-gradient"
          onClick={() => setShowNodePurchaseDialog(true)}
          disabled={nodesInformation.featureFlags.purchasingDisabled}
        >
          {nodesInformation.featureFlags.purchasingDisabled && <>Temporarily Unavailable</>}

          {!nodesInformation.featureFlags.purchasingDisabled && <>Buy StrikeBit Engines</>}
        </Button>
      </div>
    </Container> */}

    {/* <Container className="mb-1 h2 text-center">
      <StarIcon /><span className="mx-3">My Referral Code</span><StarIcon />
    </Container>

    <Row>
      <Col>
        <Card
          className="bg-blur-primary"
          border="primary"
        >
          <Card.Body>
            <Row>
              <Col
                xs={12}
                md={6}
                className="d-flex m-0 align-items-center justify-content-start h3"
              >
                {referralCode.code}

                <CopyToClipboard
                  text={referralCode.code}
                  onCopy={() => toast.info("Referral code copied!", { autoClose: 1500 })}
                >
                  <Button variant="primary ms-3" title="Copy referral code">
                    <MdOutlineContentCopy />
                  </Button>
                </CopyToClipboard>

                <CopyToClipboard
                  text={routes.referralLink(referralCode.code)}
                  onCopy={() => toast.info("Referral link copied!", { autoClose: 1500 })}
                >
                  <Button variant="primary ms-2" title="Copy referral link">
                    <TbLink />
                  </Button>
                </CopyToClipboard>
              </Col>

              <Col
                xs={12}
                md={6}
                className="d-flex m-0 mt-3 mt-md-0 align-items-center justify-content-start justify-content-md-end h6"
              >
                Share your referral code and start earning USDT rewards, 5% from each sale.
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row> */}

    {/* <Container className="mt-2 mb-1 h2 text-center">
      <StarIcon /><span className="mx-3">My Engines</span><StarIcon />
    </Container>

    <Row>
      <Col>
        <Card
          className="bg-blur-primary"
          border="primary"
        >
          <Card.Body>
            <Row>
              <Col xs={12} md={6}>
                <Stack gap={3}>
                  <div>
                    <Card.Title>StrikeBit Engines</Card.Title>
                    <div>
                      <span className="card-subtitle h3">
                        {userNodesSummary.totalPurchasedNodesCount.map((x) => x.count).reduce((prev, cur) => prev + cur, 0)}
                      </span>
                      <span className="card-subtitle h4"> holding</span>
                    </div>
                  </div>

                  <div>
                    <Card.Title>DePIN Keys</Card.Title>
                    <div>
                      <span className="card-subtitle h3">
                        {userNodesSummary.totalDePinKeyCount}
                      </span>
                      <span className="card-subtitle h4"> granted</span>
                    </div>
                  </div>
                </Stack>
              </Col>

              <Col xs={12}
                md={6}
                className="d-flex flex-column justify-content-evenly m-0 mt-3 mt-md-0 h6"
              >
                <p>
                  For every 5 purchased Engines, you are granted a <a
                    href={routes.docs.dePinKey()}
                    target="_blank"
                    rel="noreferrer"
                  >
                    DePIN Key
                  </a>!
                </p>

                <p className="mb-0">Each Engine and each DePIN Key generate
                  more {commonTerms.holdingRewardVestedTokenName} for you, every day at midnight
                  00:00 UTC.</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>

    <Container className="mt-2 mb-1 h2 text-center">
      <StarIcon /><span className="mx-3">My Balance</span><StarIcon />
    </Container>

    <Card
      className="row g-0 flex-row bg-blur-primary"
      border="primary"
      style={{
        paddingBottom: "var(--bs-gutter-y)"
      }}
    >
      <Col xs={12} md={6}>
        <Card className="h-100 border-0 g-0">
          <Card.Body className="d-flex vstack gap-3 justify-content-between">
            <Stack gap={3}>
              <div>
                <Card.Title>{commonTerms.holdingRewardVestedTokenName} Rewards</Card.Title>
                <div>
                  <span className="card-subtitle h3">
                    {formatHoldingTokenAmount(BigInt(userNodesSummary.totalHoldingRewardVestedTokenAmount))}
                  </span>
                  <span className="card-subtitle h4"> {commonTerms.holdingRewardVestedTokenName}</span>
                </div>
              </div>

              <div>
                <Card.Title>{commonTerms.holdingRewardTokenName} Rewards</Card.Title>
                <div>
                  <span className="card-subtitle h3">
                    {formatHoldingTokenAmount(BigInt(userNodesSummary.totalHoldingRewardAvailableTokenAmount))}
                  </span>
                  <span className="card-subtitle h4"> {commonTerms.holdingRewardTokenName}</span>
                </div>
              </div>

              {!nodesInformation.featureFlags.holdingRewardsWithdrawDisabled && <>
                <Button
                  variant="primary p-3 px-4 fs-5"
                  disabled={!canWithdrawHoldingRewards}
                  onClick={() => onWithdrawHoldingRewardsClicked()}
                >
                  <TbShare2 className="me-2" /> Claim {commonTerms.holdingRewardTokenName}
                </Button>
              </>}

              <div>
                <Card.Title>{commonTerms.dePinKeyPurchaseRewardTokenName} Rewards</Card.Title>
                <div>
                  <span className="card-subtitle h3">
                    {formatDePinKeyPurchaseRewardTokenAmount(BigInt(userNodesSummary.totalDePinKeyPurchaseRewardAvailableTokenAmount))}
                  </span>
                  <span className="card-subtitle h4"> {commonTerms.dePinKeyPurchaseRewardTokenName}</span>
                </div>
              </div>

              {!nodesInformation.featureFlags.dePinKeyPurchaseRewardsWithdrawDisabled && <>
                <Button
                  variant="primary p-3 px-4 fs-5"
                  disabled={!canWithdrawDePinKeyPurchaseRewards}
                  onClick={() => onWithdrawDePinKeyPurchaseRewardsClicked()}
                >
                  <TbShare2 className="me-2" /> Claim {commonTerms.dePinKeyPurchaseRewardTokenName}
                </Button>
              </>}
            </Stack>
          </Card.Body>
        </Card>
      </Col>

      <Col xs={12} md={6}>
        <Card className="h-100 border-0 g-0">
          <Card.Body>
            <Card.Title>USDT Rewards</Card.Title>
            <Stack gap={3}>
              <div className="mb-md-3">
                <span
                  className="card-subtitle h3">{formatReferralTokenAmount(BigInt(userNodesSummary?.totalReferralRewardAvailableTokenAmount))}</span>
                <span className="card-subtitle h4"> USDT</span>
              </div>

              {!nodesInformation.featureFlags.referralRewardsWithdrawDisabled && <>
                <Button
                  variant="primary p-3 px-4 fs-5"
                  disabled={BigInt(userNodesSummary.totalReferralRewardAvailableTokenAmount) <= 0}
                  onClick={() => onWithdrawReferralRewardsClicked()}
                >
                  <BiMoneyWithdraw className="me-2" /> Withdraw
                </Button>
              </>}

              <Button
                variant="primary p-3 px-4 fs-5"
                onClick={() => onViewReferralPurchasesHistoryClicked()}
              >
                <MdOutlineHistory className="me-2" /> Reward History
              </Button>
            </Stack>
          </Card.Body>
        </Card>
      </Col>
    </Card> */}

    <PurchaseNodesDialog
      referralCodeRequired={nodesInformation.featureFlags.purchasingReferralCodeRequired}
      nodeTypes={nodesInformation.nodeTypes}
      selectedNodeTypeId={selectedNodeTypeId}
      setSelectedNodeTypeId={setSelectedNodeTypeId}
      purchaseTokenAddress={nodesInformation.purchaseInfo.erc20Token.address}
      purchaseTokenDecimals={nodesInformation.purchaseInfo.erc20Token.decimals}
      isOpen={showNodePurchaseDialog}
      onClose={() => setShowNodePurchaseDialog(false)}
      purchasedCallback={() => onNodePurchased()}
    />
  </div>
}

const HomePage: NextPage = () => {
  const router = useRouter();
  const user = useUser();

  const [referralCode, setReferralCode] = useState<UserMyReferralCodeResponseDto | null>(null);
  const [userNodesSummary, setUserNodesSummary] = useState<UserNodesAccountSummaryDto | null>(null);
  const [nodesInformation, setNodesInformation] = useState<NodesInformationDto | null>(null);

  const fetchData = async () => {
    console.log("Fetching data");

    try {
      const options = {
        headers: noCacheHeaders
      };
      const myReferralCodePromise = remoteData.getMyReferralCode(clientApiServices, null, null, options);
      const myNodesSummaryPromise = remoteData.getMyNodesSummary(clientApiServices, null, null, options);
      const nodesInformationPromise = remoteData.getNodesInformation(clientApiServices, null, null, options);

      setReferralCode(await myReferralCodePromise);
      setUserNodesSummary(await myNodesSummaryPromise);
      setNodesInformation(await nodesInformationPromise);

      //await new Promise(r => setTimeout(r, 4500));
    } catch (err: any) {
      defaultErrorHandler(err, "Failed to update user data: ");
    }
  }

  const fetchUserSummaryData = async (clearCurrentData: boolean) => {
    console.log("Fetching user summary data");

    if (clearCurrentData) {
      setUserNodesSummary(null);
    }
    try {
      const options = {
        headers: noCacheHeaders
      };
      const data = (await clientApiServices.distribrainNodesApi.nodesControllerGetUserSummary(options)).data;
      setUserNodesSummary(data);
      return data;
    } catch (err: any) {
      defaultErrorHandler(err);
      return null;
    }
  }

  useAsyncEffect(async _ => {
    if (!user.initialized)
      return;

    if (!user.user) {
      await router.push(routes.login());
      return;
    }

    await fetchData();
  }, [user]);

  const referralPurchasesHistoryDialog = useNodesReferralPurchasesHistoryDialog();
  const withdrawReferralRewardsDialog = useWithdrawNodesReferralRewardsDialog();
  const withdrawHoldingRewardsDialog = useWithdrawNodesHoldingRewardsDialog();
  const withdrawDePinKeyPurchaseRewardsDialog = useWithdrawDePinKeyPurchaseRewardsDialog();

  const showReferralPurchasesHistoryDialog = () => {
    referralPurchasesHistoryDialog.open({
      referralRewardTokenDecimals: nodesInformation!.holdingRewardErc20Token?.decimals ?? 0
    });
  }

  const showWithdrawReferralRewardsDialog = () => {
    withdrawReferralRewardsDialog.open({
      userNodesSummary: userNodesSummary,
      referralRewardToken: nodesInformation!.holdingRewardErc20Token,
      confirmCallback: async () => {
      },
      successCallback: () => fetchData(),
      refetchUserSummary: fetchUserSummaryData,
    })
  }

  const showWithdrawHoldingRewardsDialog = () => {
    withdrawHoldingRewardsDialog.open({
      userNodesSummary: userNodesSummary,
      holdingRewardToken: nodesInformation!.holdingRewardErc20Token,
      holdingRewardEarlyWithdrawalPenaltyBps: nodesInformation!.holdingRewardEarlyWithdrawalPenaltyBps,
      holdingRewardMinAmountOnWalletRequiredForWithdrawal: BigInt(nodesInformation!.holdingRewardMinAmountOnWalletRequiredForWithdrawal),
      confirmCallback: async () => {
      },
      successCallback: () => fetchData(),
      refetchUserSummary: fetchUserSummaryData,
    });
  }

  const showWithdrawDePinKeyPurchaseRewardsDialog = () => {
    withdrawDePinKeyPurchaseRewardsDialog.open({
      userNodesSummary: userNodesSummary,
      dePinKeyPurchaseRewardToken: nodesInformation!.dePinKeyPurchaseRewardErc20Token,
      confirmCallback: async () => {
      },
      successCallback: () => fetchData(),
      refetchUserSummary: fetchUserSummaryData,
    })
  }

  const loaded = user.user && referralCode != null && userNodesSummary != null && nodesInformation != null;

  return (
    <>
      <Container
        className="d-flex position-relative vstack justify-content-center gap-3"
        style={{
          maxWidth: "",
        }}
      >
        {/* <Image
          src={logo2}
          alt="StrikeBit"
          height={168}
          width={161}
          className=""
          style={{
            width: "100%",
            objectFit: "contain"
          }}
        /> */}

        {!loaded && <>
          <Spinner style={{
            alignSelf: "center",
            // @ts-ignore
            "--bs-spinner-width": "5rem",
            "--bs-spinner-height": "5rem"
          }} />
        </>}

        {loaded && <>
          <HomePageBody
            nodesInformation={nodesInformation}
            userNodesSummary={userNodesSummary}
            referralCode={referralCode}
            refetchData={() => fetchData()}
            onViewReferralPurchasesHistoryClicked={() => showReferralPurchasesHistoryDialog()}
            onWithdrawReferralRewardsClicked={() => showWithdrawReferralRewardsDialog()}
            onWithdrawHoldingRewardsClicked={() => showWithdrawHoldingRewardsDialog()}
            onWithdrawDePinKeyPurchaseRewardsClicked={() => showWithdrawDePinKeyPurchaseRewardsDialog()}
          />
        </>}
      </Container>
    </>
  );
}

const remoteData = {
  getMyReferralCode: basicRemoteDataFetcherFn(
    (apiServices, options) => apiServices.distribrainNodesUsersApi.usersControllerGetMyReferralCode(options)
  ),
  getNodesInformation: basicRemoteDataFetcherFn(
    (apiServices, options) => apiServices.distribrainNodesApi.nodesControllerGetInformation(options)
  ),
  getMyNodesSummary: basicRemoteDataFetcherFn(
    (apiServices, options) => apiServices.distribrainNodesApi.nodesControllerGetUserSummary(options)
  ),
  getMyReferralPurchases: basicRemoteDataFetcherFn(
    (apiServices, options) => apiServices.distribrainNodesApi.nodesControllerGetReferralPurchases(options)
  ),
}

export default HomePage;