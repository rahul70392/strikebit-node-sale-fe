import {Badge, Button, Card, Col, Container, Row, Spinner, Stack} from "react-bootstrap";
import {NextPage} from "next";
import React, {useState} from "react";
import Logo from "../assets/images/Logo.svg";
import Image from "next/image";
import {useRouter} from "next/router";
import {useUserService} from "@/services/UserService";
import useAsyncEffect from "use-async-effect";
import {MdOutlineContentCopy, MdOutlineHistory} from "react-icons/md";
import {BiMoneyWithdraw} from "react-icons/bi";
import {TbShare2} from "react-icons/tb";
import {basicRemoteDataFetcherFn} from "@/utils/basicRemoteDataFetcher";
import clientApiServices from "@/services/clientApiServices";
import {
  NodesInformationDto,
  UserMyReferralCodeResponseDto,
  UserNodesAccountSummaryDto
} from "@/generated/droplet-nodes-api";
import {formatTokenAmountUI} from "@/utils/formatTokenAmountUI";
import {uiIntNumberNiceFormat} from "@/utils/uiNiceFormat";
import {CopyToClipboard} from "react-copy-to-clipboard";
import {toast} from "react-toastify";
import noCacheHeaders from "@/utils/noCacheHeaders";
import {useNodesReferralPurchasesHistoryDialog} from "@/components/dialogs/useNodesReferralPurchasesHistoryDialog";
import {StarIcon} from "@/components/visual/StarIcon";
import {PurchaseNodesDialog} from "@/components/dialogs/PurchaseNodesDialog/PurchaseNodesDialog";
import {routes} from "@/data/routes";
import {useWithdrawNodesReferralRewardsDialog} from "@/components/dialogs/useWithdrawNodesReferralRewardsDialog";
import {useWithdrawNodesHoldingRewardsDialog} from "@/components/dialogs/useWithdrawNodesHoldingRewardsDialog";

const HomePageBody = (
  {
    referralCode,
    userNodesSummary,
    nodesInformation,
    refetchData,
    onViewReferralPurchasesHistoryClicked,
    onWithdrawReferralRewardsClicked,
    onWithdrawHoldingRewardsClicked,
  }: {
    referralCode: UserMyReferralCodeResponseDto;
    userNodesSummary: UserNodesAccountSummaryDto;
    nodesInformation: NodesInformationDto;
    refetchData: () => void;
    onViewReferralPurchasesHistoryClicked: () => void;
    onWithdrawReferralRewardsClicked: () => void;
    onWithdrawHoldingRewardsClicked: () => void;
  }
) => {
  const router = useRouter();
  const userService = useUserService();
  const [showPurchaseDialog, setShowNodePurchaseDialog] = useState(false);

  const canWithdrawHoldingRewards =
    BigInt(userNodesSummary.totalHoldingRewardBalanceTokenAmount) > 0;

  const formatHoldingTokenAmount = (amount: bigint) =>
    formatTokenAmountUI(amount, nodesInformation?.holdingRewardErc20Token?.decimals ?? 0);

  const formatReferralTokenAmount = (amount: bigint) =>
    formatTokenAmountUI(amount, nodesInformation?.referralRewardErc20Token?.decimals ?? 0);

  const onNodePurchased = async () => {
    setShowNodePurchaseDialog(false);
    refetchData();
  }

  const onLogoutClicked = async () => {
    try {
      await userService.logout();
    } catch (err: any) {
      console.log(err)
    }
    toast.info("Logged out successfully.");
    await router.push(routes.login());
  }

  return <>
    <Container className="text-center mb-2">
      Hi, {userService.getUserName()}
      <Button
        variant="link"
        className="d-inline p-0 ps-2"
        onClick={() => onLogoutClicked()}
      >
        [Logout]
      </Button>
    </Container>

    <Container className="h1 text-center">
      Total <Badge bg="primary" pill>
      {uiIntNumberNiceFormat(nodesInformation.purchaseInfo.globalPurchasedNodesCount)}
    </Badge> Droplet Engines Sold
    </Container>

    <Container className="h1 m-0 text-center position-relative">
      <div className="animated-edge-button-wrapper">
        <Button
          variant="primary"
          className="p-3 px-lg-4 fs-3 fw-bold flex-fill flex-lg-grow-0 animated-edge-button"
          onClick={() => setShowNodePurchaseDialog(true)}
        >
          Buy Droplet Engines
        </Button>
      </div>
    </Container>

    <Container className="mt-2 mb-1 h2 text-center">
      <StarIcon/><span className="mx-3">My Referral Code</span><StarIcon/>
    </Container>

    <Row>
      <Col>
        <Card border={"primary"}>
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
                  onCopy={() => toast.info("Referral code copied!", {autoClose: 1500})}
                >
                  <Button variant="primary ms-3">
                    <MdOutlineContentCopy/>
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
    </Row>

    {/*            <Container className="d-flex flex-column align-items-center justify-content-center gap-2 card border-primary">
                <div className="h2">My Referral Code</div>
                <div className="h6 text-muted">Share your referral code to and earn USDT rewards</div>

                <div
                    className="d-flex mt-3 m-md-0 align-items-center justify-content-center fs-4"
                >
                    8KQWKA50
                    <Button variant="primary ms-3">
                        <MdOutlineContentCopy/>
                    </Button>
                </div>
            </Container>*/}

    {/*            <Row>
                <Col>
                    <Card border={"primary"}>
                        <Card.Body>
                            <Row>
                                <Col xs={12} md={8}>
                                    <Card.Title><StarIcon className="d-none d-sm-inline-block"/> My Referral Code</Card.Title>
                                    <Card.Subtitle>Share your referral code to and earn USDT rewards</Card.Subtitle>
                                </Col>

                                <Col
                                    xs={12}
                                    md={4}
                                    className="d-flex mt-3 m-md-0 align-items-center justify-content-center justify-content-md-end fs-4"
                                >
                                    8KQWKA50
                                    <Button variant="primary ms-3">
                                        <MdOutlineContentCopy/>
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>*/}

    <Container className="mt-2 mb-1 h2 text-center">
      <StarIcon/><span className="mx-3">My Engines</span><StarIcon/>
    </Container>

    <Row>
      <Col>
        <Card border={"primary"}>
          <Card.Body>
            <Row>
              <Col xs={12} md={6}>
                <Stack gap={3}>
                  <div>
                    <Card.Title>Droplet Engines</Card.Title>
                    <div>
                      <span className="card-subtitle h3">
                        {userNodesSummary.totalPurchasedNodesCount}
                      </span>
                      <span className="card-subtitle h4"> holding</span>
                    </div>
                  </div>

                  <div>
                    <Card.Title>DePin Keys</Card.Title>
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
                <p>Each Engine generates more vDROP for you, every day at midnight 00:00 UTC.</p>
                <p className="mb-0">
                  For every 5 purchased Engines, you are also granted a <a
                  href={routes.docs.dePin()}
                  target="_blank"
                  rel="noreferrer"
                >
                  DePin Key
                </a>!
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>

    <Container className="mt-2 mb-1 h2 text-center">
      <StarIcon/><span className="mx-3">My Balance</span><StarIcon/>
    </Container>

    <Card
      className="row g-0 flex-row"
      border={"primary"}
      style={{
        paddingBottom: "var(--bs-gutter-y)"
      }}
    >
      <Col xs={12} md={6}>
        <Card className="h-100 border-0 g-0">
          <Card.Body className="d-flex vstack gap-3 justify-content-between">
            <Stack gap={3}>
              <div>
                <Card.Title>vDROP Rewards</Card.Title>
                <div>
                  <span className="card-subtitle h3">
                    {formatHoldingTokenAmount(BigInt(userNodesSummary.totalHoldingRewardVestedTokenAmount))}
                  </span>
                  <span className="card-subtitle h4"> vDROP</span>
                </div>
              </div>

              <div>
                <Card.Title>DROP Rewards</Card.Title>
                <div>
                  <span className="card-subtitle h3">
                    {formatHoldingTokenAmount(BigInt(userNodesSummary.totalHoldingRewardAvailableTokenAmount))}
                  </span>
                  <span className="card-subtitle h4"> DROP</span>
                </div>
              </div>
            </Stack>

            <Button
              variant="primary p-3 px-4 fs-5"
              disabled={!canWithdrawHoldingRewards}
              onClick={() => onWithdrawHoldingRewardsClicked()}
            >
              <TbShare2 className="me-2"/> Claim DROP
            </Button>
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

              <Button
                variant="primary p-3 px-4 fs-5"
                disabled={BigInt(userNodesSummary.totalReferralRewardAvailableTokenAmount) <= 0}
                onClick={() => onWithdrawReferralRewardsClicked()}
              >
                <BiMoneyWithdraw className="me-2"/> Withdraw
              </Button>

              <Button
                variant="primary p-3 px-4 fs-5"
                onClick={() => onViewReferralPurchasesHistoryClicked()}
              >
                <MdOutlineHistory className="me-2"/> Reward History
              </Button>
            </Stack>
          </Card.Body>
        </Card>
      </Col>
    </Card>

    <PurchaseNodesDialog
      pricePerNode={BigInt(nodesInformation.purchaseInfo.currentPricePerNode)}
      currentNodeLimit={nodesInformation.purchaseInfo.limitAtPrice}
      globalTotalPurchasedNodes={nodesInformation.purchaseInfo.globalPurchasedNodesCount}
      purchaseTokenAddress={nodesInformation.purchaseInfo.erc20Token.address}
      purchaseTokenDecimals={nodesInformation.purchaseInfo.erc20Token.decimals}
      isOpen={showPurchaseDialog}
      onClose={() => setShowNodePurchaseDialog(false)}
      purchasedCallback={() => onNodePurchased()}
    />
  </>
}

const HomePage: NextPage = () => {
  const router = useRouter();
  const userService = useUserService();

  const [referralCode, setReferralCode] = useState<UserMyReferralCodeResponseDto | null>(null);
  const [userNodesSummary, setUserNodesSummary] = useState<UserNodesAccountSummaryDto | null>(null);
  const [nodesInformation, setNodesInformation] = useState<NodesInformationDto | null>(null);

  const fetchData = async () => {
    console.log("Fetching data");

    const options = {
      headers: noCacheHeaders
    };
    const myReferralCodePromise = remoteData.getMyReferralCode(clientApiServices, null, null, options);
    const myNodesSummaryPromise = remoteData.getMyNodesSummary(clientApiServices, null, null, options);
    const nodesInformationPromise = remoteData.getNodesInformation(clientApiServices, null, null, options);

    setReferralCode(await myReferralCodePromise);
    setUserNodesSummary(await myNodesSummaryPromise);
    setNodesInformation(await nodesInformationPromise);
  }

  useAsyncEffect(async _ => {
    await userService.initialize();
    //await new Promise(r => setTimeout(r, 3000));
    if (!userService.isLoggedIn()) {
      await router.push(routes.login());
      return;
    }

    await fetchData();
  }, []);

  const referralPurchasesHistoryDialog = useNodesReferralPurchasesHistoryDialog();
  const withdrawReferralRewardsDialog = useWithdrawNodesReferralRewardsDialog();
  const withdrawHoldingRewardsDialog = useWithdrawNodesHoldingRewardsDialog();

  const showReferralPurchasesHistoryDialog = () => {
    referralPurchasesHistoryDialog.open({
      referralRewardTokenDecimals: nodesInformation!.holdingRewardErc20Token?.decimals ?? 0
    });
  }

  const showWithdrawReferralRewardsDialog = () => {
    withdrawReferralRewardsDialog.open({
      referralRewardTokenDecimals: nodesInformation!.holdingRewardErc20Token?.decimals ?? 0,
      referralRewardTokenAmount: BigInt(userNodesSummary!.totalReferralRewardAvailableTokenAmount),
      confirmCallback: () => {
      },
      successCallback: async () => await fetchData()
    })
  }

  const showWithdrawHoldingRewardsDialog = () => {
    withdrawHoldingRewardsDialog.open({
      holdingRewardTotalBalanceTokenAmount: BigInt(userNodesSummary!.totalHoldingRewardBalanceTokenAmount),
      holdingRewardVestedTokenAmount: BigInt(userNodesSummary!.totalHoldingRewardVestedTokenAmount),
      holdingRewardAvailableTokenAmount: BigInt(userNodesSummary!.totalHoldingRewardAvailableTokenAmount),
      holdingRewardTokenDecimals: nodesInformation!.holdingRewardErc20Token?.decimals ?? 0,
      holdingRewardEarlyWithdrawalPenaltyBps: nodesInformation!.holdingRewardEarlyWithdrawalPenaltyBps,
      confirmCallback: () => {
      },
      successCallback: async () => await fetchData()
    })
  }

  const loaded = userService.isLoggedIn() && referralCode != null && userNodesSummary != null && nodesInformation != null;

  return (
    <>
      <Container
        className="d-flex position-relative mt-4 vstack justify-content-center gap-3"
        style={{
          maxWidth: "700px",
        }}
      >
        <Image
          src={Logo}
          alt="Logo"
          priority={true}
          className="w-100 h-auto px-3 mb-3"
          style={{
            maxHeight: "80px"
          }}
        />

        {!loaded && <>
            <Spinner style={{
              alignSelf: "center",
              // @ts-ignore
              "--bs-spinner-width": "5rem",
              "--bs-spinner-height": "5rem"
            }}/>
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
            />
        </>}
      </Container>
    </>
  );
}

const remoteData = {
  getMyReferralCode: basicRemoteDataFetcherFn(
    (apiServices, options) => apiServices.dropletNodesUsersApi.usersControllerGetMyReferralCode(options)
  ),
  getNodesInformation: basicRemoteDataFetcherFn(
    (apiServices, options) => apiServices.dropletNodesApi.nodesControllerGetInformation(options)
  ),
  getMyNodesSummary: basicRemoteDataFetcherFn(
    (apiServices, options) => apiServices.dropletNodesApi.nodesControllerGetUserSummary(options)
  ),
  getMyReferralPurchases: basicRemoteDataFetcherFn(
    (apiServices, options) => apiServices.dropletNodesApi.nodesControllerGetReferralPurchases(options)
  ),
}

export default HomePage;