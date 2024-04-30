import React, {useCallback, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {DialogConfig, useGenericConfirmationDialog} from "./GenericConfirmationDialog";
import clientApiServices from "@/services/clientApiServices";
import wagmiConfig from "@/contexts/web3/wagmiConfig";
import {useAccount, useReadContract} from "wagmi";
import {formatTokenAmountUI} from "@/utils/formatTokenAmountUI";
import {Alert, Form, InputGroup, Spinner, Stack} from "react-bootstrap";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {uiPercentageNumberNiceFormat} from "@/utils/uiNiceFormat";
import {defaultErrorHandler} from "@/utils/defaultErrorHandler";
import {Address, erc20Abi} from "viem";
import {UserNodesAccountSummaryDto} from "@/generated/droplet-nodes-api";

interface WithdrawNodesHoldingRewardsDialogOpenProps {
  holdingRewardTokenAddress: string;
  holdingRewardTokenDecimals: number;
  holdingRewardEarlyWithdrawalPenaltyBps: number;
  holdingRewardMinAmountOnWalletRequiredForWithdrawal: bigint;
  confirmCallback: () => void
  successCallback: () => void
}

interface WithdrawNodesHoldingRewardsDialogContextProps {
  open: (openProps: WithdrawNodesHoldingRewardsDialogOpenProps) => void,
}

export const useWithdrawNodesHoldingRewardsDialog = (): WithdrawNodesHoldingRewardsDialogContextProps => {
  const web3Account = useAccount();
  const isCorrectChain = web3Account.chainId === wagmiConfig.chain.id;
  const isCorrectWalletConnected = web3Account.isConnected && isCorrectChain;

  const [openProps, setOpenProps] = useState<WithdrawNodesHoldingRewardsDialogOpenProps | null>(null);
  const {open: openGenericConfirmationDialog, set: updateGenericConfirmationDialog} = useGenericConfirmationDialog();

  const [userNodesSummary, setUserNodesSummary] = useState<UserNodesAccountSummaryDto | null>(null);
  const fetchUserNodesSummary = async () => {
    setUserNodesSummary(null);
    try {
      setUserNodesSummary((await clientApiServices.dropletNodesApi.nodesControllerGetUserSummary()).data);
    } catch (err: any) {
      defaultErrorHandler(err);
    }
  }

  const holdingRewardVestedTokenAmount =
    userNodesSummary?.totalHoldingRewardVestedTokenAmount ?
      BigInt(userNodesSummary?.totalHoldingRewardVestedTokenAmount) :
      null;
  const holdingRewardAvailableTokenAmount =
    userNodesSummary?.totalHoldingRewardAvailableTokenAmount ?
      BigInt(userNodesSummary?.totalHoldingRewardAvailableTokenAmount) :
      null;

  const [includeVested, setIncludeVested] = useState(false);

  const holdingRewardTokenUserWalletBalance = useReadContract({
    abi: erc20Abi,
    address: openProps?.holdingRewardTokenAddress as Address,
    chainId: wagmiConfig.chain.id,
    functionName: "balanceOf",
    args: [web3Account.address as Address],
  });

  console.log("web3Account.address, holdingRewardTokenUserWalletBalance", web3Account.address, holdingRewardTokenUserWalletBalance.data);

  const isMinUserWalletBalanceReached =
    openProps != null &&
    holdingRewardTokenUserWalletBalance.data != null &&
    holdingRewardTokenUserWalletBalance.data >= openProps.holdingRewardMinAmountOnWalletRequiredForWithdrawal;

  let withdrawalAmount = holdingRewardAvailableTokenAmount ?? 0n;
  let deductionAmount = holdingRewardAvailableTokenAmount ?? 0n;

  if (includeVested && openProps && holdingRewardVestedTokenAmount != null) {
    deductionAmount += holdingRewardVestedTokenAmount;
    withdrawalAmount +=
      holdingRewardVestedTokenAmount *
      BigInt(10000 - openProps.holdingRewardEarlyWithdrawalPenaltyBps) /
      10000n;
  }

  const isWithdrawableWithoutMinUserBalanceCheck = isCorrectWalletConnected && withdrawalAmount >= 100_000n;
  const isWithdrawable = isWithdrawableWithoutMinUserBalanceCheck && isMinUserWalletBalanceReached;

  const formattedVestedAmount =
    openProps != null && holdingRewardVestedTokenAmount != null ?
      `${formatTokenAmountUI(holdingRewardVestedTokenAmount, openProps.holdingRewardTokenDecimals)} vDROP` :
      "";

  const formattedAvailableAmount =
    openProps != null && holdingRewardAvailableTokenAmount != null ?
      `${formatTokenAmountUI(holdingRewardAvailableTokenAmount, openProps.holdingRewardTokenDecimals)} DROP` :
      "";

  const formattedWithdrawalAmount =
    openProps != null ?
      `${formatTokenAmountUI(withdrawalAmount, openProps.holdingRewardTokenDecimals)} DROP` :
      "";

  const formattedDeductionAmount =
    openProps != null && holdingRewardAvailableTokenAmount != null && holdingRewardVestedTokenAmount != null ?
      (includeVested ?
          `${formatTokenAmountUI(holdingRewardAvailableTokenAmount, openProps.holdingRewardTokenDecimals)} DROP + 
          ${formatTokenAmountUI(holdingRewardVestedTokenAmount, openProps.holdingRewardTokenDecimals)} vDROP` :
          `${formatTokenAmountUI(deductionAmount, openProps.holdingRewardTokenDecimals)} DROP`
      ) : "";

  const formattedUserBalance =
    openProps != null && holdingRewardTokenUserWalletBalance.data != null ?
      `${formatTokenAmountUI(holdingRewardTokenUserWalletBalance.data, openProps.holdingRewardTokenDecimals)} DROP` :
      "...";

  const handleConfirm = useCallback(async function (confirmCallback?: () => void, successCallback?: () => void) {
    try {
      confirmCallback?.();

      const address = web3Account.address;
      await clientApiServices.dropletNodesApi.nodesControllerPostHoldingRewardsWithdraw({
        address: address!,
        includeVested
      });
      toast.success(`Successfully withdrawn ${formattedWithdrawalAmount} to address ${address}!`);

      successCallback?.();
    } catch (err: any) {
      defaultErrorHandler(err, "Failed to withdraw holding reward: ");
      return false;
    }

    return true;
  }, [formattedWithdrawalAmount, includeVested, web3Account.address]);

  const dialogConfig = useCallback((openProps: WithdrawNodesHoldingRewardsDialogOpenProps) => {
    const dialogContent = <>
      {!userNodesSummary && <Spinner className="d-block m-auto"/>}

      {userNodesSummary && <>
          <Stack direction="vertical" gap={3}>
              <Stack className="">
                {isCorrectWalletConnected && <>
                    <span style={{wordBreak: "break-all"}}>
                      <span className="fw-bolder">Address: </span>{web3Account.address}
                    </span>

                    <span className="">
                        <span className="fw-bolder">Wallet DROP Balance: </span>{formattedUserBalance}
                    </span>
                </>}
              </Stack>

              <Stack className="web3-connect-button-wrapper">
                  <ConnectButton showBalance={false}/>
              </Stack>

              <Stack className="fs-5 mt-3">
                  <span><span className="fw-bolder">DROP Balance: </span>{formattedAvailableAmount}</span>
                  <span><span className="fw-bolder">vDROP Balance: </span>{formattedVestedAmount}</span>

                  <span className="mt-3"><span className="fw-bolder">You Claim: </span>{formattedDeductionAmount}</span>
                  <span><span className="fw-bolder">You Receive: </span>{formattedWithdrawalAmount}</span>
              </Stack>

            {(!isWithdrawable && isWithdrawableWithoutMinUserBalanceCheck) && <>
                <Alert variant="warning">
                    Minimum
                    of {formatTokenAmountUI(openProps.holdingRewardMinAmountOnWalletRequiredForWithdrawal, openProps.holdingRewardTokenDecimals)} DROP
                    on the connected wallet is required for withdrawal. You can buy more DROP on any supported exchange.
                </Alert>
            </>}

              <InputGroup>
                  <Form.Check
                      type="checkbox"
                      checked={includeVested}
                      onChange={e => setIncludeVested(e.target.checked)}
                      label={<>Withdraw vDROP
                        ({uiPercentageNumberNiceFormat(openProps.holdingRewardEarlyWithdrawalPenaltyBps / 10000)} penalty)</>}
                      className="pe-2 fs-5"
                      id="holding-reward-withdraw-include-vested-check"
                  />
              </InputGroup>
          </Stack>
      </>}
    </>;

    const config: DialogConfig = {
      title: `Withdraw Holding Rewards`,
      content:
      dialogContent,
      buttons:
        [
          {
            kind: "confirm",
            title: !isWithdrawable && isWithdrawableWithoutMinUserBalanceCheck ?
              "Insufficient DROP balance on wallet" :
              "Withdraw",
            disabled: !isWithdrawable,
            onClick: () => handleConfirm(openProps.confirmCallback, openProps.successCallback)
          }
        ],
      modalFooterProps:
        {
          className: "justify-content-center"
        }
    };

    return config;
  }, [formattedAvailableAmount, formattedDeductionAmount, formattedUserBalance, formattedVestedAmount, formattedWithdrawalAmount, handleConfirm, includeVested, isCorrectWalletConnected, isWithdrawable, isWithdrawableWithoutMinUserBalanceCheck, userNodesSummary, web3Account.address]);

  useEffect(() => {
    if (!openProps)
      return;

    updateGenericConfirmationDialog(dialogConfig(openProps));
  }, [dialogConfig, openProps, updateGenericConfirmationDialog, web3Account.address, web3Account.chainId]);

  return {
    open: (openProps: WithdrawNodesHoldingRewardsDialogOpenProps) => {
      setOpenProps(openProps);
      openGenericConfirmationDialog(dialogConfig(openProps));

      fetchUserNodesSummary().then(() => {
      });
    }
  }
}
