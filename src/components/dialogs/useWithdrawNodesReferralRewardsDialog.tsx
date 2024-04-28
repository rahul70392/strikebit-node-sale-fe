import React, {useCallback, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {DialogConfig, useGenericConfirmationDialog} from "./GenericConfirmationDialog";
import clientApiServices from "@/services/clientApiServices";
import wagmiConfig from "@/contexts/web3/wagmiConfig";
import {useAccount} from "wagmi";
import {formatTokenAmountUI} from "@/utils/formatTokenAmountUI";
import {BasicWithdrawDialogBody} from "@/components/dialogs/BasicWithdrawDialogBody";

interface WithdrawNodesReferralRewardsDialogOpenProps {
  referralRewardTokenAmount: bigint | undefined;
  referralRewardTokenDecimals: number;
  confirmCallback: () => void
  successCallback: () => void
}

interface WithdrawNodesReferralRewardsDialogContextProps {
  open: (openProps: WithdrawNodesReferralRewardsDialogOpenProps) => void,
}

export const useWithdrawNodesReferralRewardsDialog = (): WithdrawNodesReferralRewardsDialogContextProps => {
  const web3Account = useAccount();
  const isCorrectChain = web3Account.chainId === wagmiConfig.chain.id;

  const [openProps, setOpenProps] = useState<WithdrawNodesReferralRewardsDialogOpenProps>({} as any);

  const {open: openGenericConfirmationDialog, set: updateGenericConfirmationDialog} = useGenericConfirmationDialog();

  const formattedAmount =
    openProps.referralRewardTokenAmount != null ?
      `${formatTokenAmountUI(openProps.referralRewardTokenAmount, openProps.referralRewardTokenDecimals)} USDT` :
      "";

  const handleConfirm = useCallback(async function (confirmCallback?: () => void, successCallback?: () => void) {
    try {
      confirmCallback?.();

      const address = web3Account.address;
      await clientApiServices.dropletNodesApi.nodesControllerPostReferralRewardsWithdraw({
        address: address!
      });
      toast.success(`Successfully withdrawn ${formattedAmount} to address ${address}!`);

      successCallback?.();
    } catch (err: any) {
      console.log(err);
      toast.error(`Failed to withdraw referral reward: ${err.message}`);
    }
  }, [formattedAmount, web3Account.address]);

  const dialogConfig = useCallback((openProps: WithdrawNodesReferralRewardsDialogOpenProps) => {
    const dialogContent =
      <BasicWithdrawDialogBody
        formattedBalance={formattedAmount}
      />;

    const config: DialogConfig = {
      title: `Withdraw Referral Rewards`,
      content: dialogContent,
      buttons: [
        {
          kind: "confirm",
          title: `Withdraw`,
          disabled: !web3Account.address || !isCorrectChain,
          onClick: () => handleConfirm(openProps.confirmCallback, openProps.successCallback)
        }
      ],
      modalFooterProps: {
        className: "justify-content-center"
      }
    }

    return config;
  }, [formattedAmount, handleConfirm, isCorrectChain, web3Account.address]);

  useEffect(() => {
    updateGenericConfirmationDialog(dialogConfig(openProps));
  }, [dialogConfig, openProps, updateGenericConfirmationDialog, web3Account.address, web3Account.chainId]);

  return {
    open: (openProps: WithdrawNodesReferralRewardsDialogOpenProps) => {
      setOpenProps(openProps);
      openGenericConfirmationDialog(dialogConfig(openProps));
    }
  }
}
