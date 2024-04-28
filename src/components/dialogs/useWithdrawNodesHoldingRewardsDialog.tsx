import React, {useCallback, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {DialogConfig, useGenericConfirmationDialog} from "./GenericConfirmationDialog";
import clientApiServices from "@/services/clientApiServices";
import wagmiConfig from "@/contexts/web3/wagmiConfig";
import {useAccount} from "wagmi";
import {formatTokenAmountUI} from "@/utils/formatTokenAmountUI";
import {Form, InputGroup, Stack} from "react-bootstrap";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import {uiPercentageNumberNiceFormat} from "@/utils/uiNiceFormat";

interface WithdrawNodesHoldingRewardsDialogOpenProps {
  holdingRewardTotalBalanceTokenAmount: bigint;
  holdingRewardVestedTokenAmount: bigint;
  holdingRewardAvailableTokenAmount: bigint;
  holdingRewardTokenDecimals: number;
  holdingRewardEarlyWithdrawalPenaltyBps: number;
  confirmCallback: () => void
  successCallback: () => void
}

interface WithdrawNodesHoldingRewardsDialogContextProps {
  open: (openProps: WithdrawNodesHoldingRewardsDialogOpenProps) => void,
}

export const useWithdrawNodesHoldingRewardsDialog = (): WithdrawNodesHoldingRewardsDialogContextProps => {
  const web3Account = useAccount();
  const isCorrectChain = web3Account.chainId === wagmiConfig.chain.id;

  const [openProps, setOpenProps] = useState<WithdrawNodesHoldingRewardsDialogOpenProps | null>(null);
  const {open: openGenericConfirmationDialog, set: updateGenericConfirmationDialog} = useGenericConfirmationDialog();

  const [includeVested, setIncludeVested] = useState(false);

  let withdrawalAmount = openProps?.holdingRewardAvailableTokenAmount ?? 0n;
  let deductionAmount = openProps?.holdingRewardAvailableTokenAmount ?? 0n;

  if (includeVested && openProps) {
    deductionAmount += openProps.holdingRewardVestedTokenAmount;
    withdrawalAmount +=
      openProps.holdingRewardVestedTokenAmount *
      BigInt(10000 - openProps.holdingRewardEarlyWithdrawalPenaltyBps) /
      10000n;
  }

  const formattedVestedAmount =
    openProps?.holdingRewardVestedTokenAmount != null ?
      `${formatTokenAmountUI(openProps.holdingRewardVestedTokenAmount, openProps.holdingRewardTokenDecimals)} vDROP` :
      "";

  const formattedAvailableAmount =
    openProps?.holdingRewardAvailableTokenAmount != null ?
      `${formatTokenAmountUI(openProps.holdingRewardAvailableTokenAmount, openProps.holdingRewardTokenDecimals)} DROP` :
      "";

  const formattedWithdrawalAmount =
    openProps != null ?
      `${formatTokenAmountUI(withdrawalAmount, openProps.holdingRewardTokenDecimals)} DROP` :
      "";

  const formattedDeductionAmount =
    openProps != null ?
      (includeVested ?
          `${formatTokenAmountUI(openProps.holdingRewardAvailableTokenAmount, openProps.holdingRewardTokenDecimals)} DROP + 
          ${formatTokenAmountUI(openProps.holdingRewardVestedTokenAmount, openProps.holdingRewardTokenDecimals)} vDROP` :
          `${formatTokenAmountUI(deductionAmount, openProps.holdingRewardTokenDecimals)} DROP`
      ) : "";

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
      console.log(err);
      toast.error(`Failed to withdraw holding reward: ${err.message}`);
    }
  }, [formattedWithdrawalAmount, includeVested, web3Account.address]);

  const dialogConfig = useCallback((openProps: WithdrawNodesHoldingRewardsDialogOpenProps) => {
    const dialogContent = <>
        <Stack direction="vertical" gap={3}>
          <Stack className="">
            {(web3Account.isConnected && isCorrectChain) && <>
                <span style={{
                  wordBreak: "break-all",
                }}>
                  <span className="fw-bolder">Address: </span> {web3Account.address}
                </span>
            </>}
          </Stack>

          <Stack className="web3-connect-button-wrapper">
            <ConnectButton showBalance={false}/>
          </Stack>

          <Stack className="fs-5 mt-3">
            <span><span className="fw-bolder">vDROP Balance: </span>{formattedVestedAmount}</span>
            <span><span className="fw-bolder">DROP Balance: </span>{formattedAvailableAmount}</span>

            <span className="mt-3"><span className="fw-bolder">You Spend: </span>{formattedDeductionAmount}</span>
            <span><span className="fw-bolder">You Receive: </span>{formattedWithdrawalAmount}</span>
          </Stack>

          <InputGroup>
            <Form.Check
              type="checkbox"
              checked={includeVested}
              onChange={e => setIncludeVested(e.target.checked)}
              label={<>Withdraw vDROP
                ({uiPercentageNumberNiceFormat(openProps.holdingRewardEarlyWithdrawalPenaltyBps / 10000)} penalty)</>}
              className="pe-2 fs-4"
              id="holding-reward-withdraw-include-vested-check"
            />
          </InputGroup>
        </Stack>
      </>
    ;

    const config: DialogConfig = {
      title: `Withdraw Holding Rewards`,
      content:
      dialogContent,
      buttons:
        [
          {
            kind: "confirm",
            title: `Withdraw`,
            disabled: !web3Account.address || !isCorrectChain || withdrawalAmount < 100_000n,
            onClick: () => handleConfirm(openProps.confirmCallback, openProps.successCallback)
          }
        ],
      modalFooterProps:
        {
          className: "justify-content-center"
        }
    };

    return config;
  }, [formattedAvailableAmount, formattedDeductionAmount, formattedVestedAmount, formattedWithdrawalAmount, handleConfirm, includeVested, isCorrectChain, web3Account.address, web3Account.isConnected, withdrawalAmount]);

  useEffect(() => {
    if (!openProps)
      return;

    updateGenericConfirmationDialog(dialogConfig(openProps));
  }, [dialogConfig, openProps, updateGenericConfirmationDialog, web3Account.address, web3Account.chainId]);

  return {
    open: (openProps: WithdrawNodesHoldingRewardsDialogOpenProps) => {
      setOpenProps(openProps);
      openGenericConfirmationDialog(dialogConfig(openProps));
    }
  }
}
