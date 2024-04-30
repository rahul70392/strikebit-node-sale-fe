import React, {useCallback, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {DialogConfig, useGenericConfirmationDialog} from "./GenericConfirmationDialog";
import clientApiServices from "@/services/clientApiServices";
import wagmiConfig from "@/contexts/web3/wagmiConfig";
import {useAccount} from "wagmi";
import {formatTokenAmountUI} from "@/utils/formatTokenAmountUI";
import {BasicWithdrawDialogBody} from "@/components/dialogs/BasicWithdrawDialogBody";
import {defaultErrorHandler} from "@/utils/defaultErrorHandler";
import {UserNodesAccountSummaryDto} from "@/generated/droplet-nodes-api";
import {Spinner} from "react-bootstrap";

interface WithdrawNodesReferralRewardsDialogOpenProps {
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
  const isCorrectWalletConnected = web3Account.isConnected && isCorrectChain;

  const [openProps, setOpenProps] = useState<WithdrawNodesReferralRewardsDialogOpenProps>({} as any);
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

  const referralRewardTokenAmount =
    userNodesSummary?.totalReferralRewardAvailableTokenAmount ?
      BigInt(userNodesSummary?.totalReferralRewardAvailableTokenAmount) :
      null;

  const formattedReferralRewardTokenAmount =
    openProps != null && referralRewardTokenAmount != null ?
      `${formatTokenAmountUI(referralRewardTokenAmount, openProps.referralRewardTokenDecimals)} USDT` :
      "";

  const handleConfirm = useCallback(async function (confirmCallback?: () => void, successCallback?: () => void) {
    try {
      confirmCallback?.();

      const address = web3Account.address;
      await clientApiServices.dropletNodesApi.nodesControllerPostReferralRewardsWithdraw({
        address: address!
      });
      toast.success(`Successfully withdrawn ${formattedReferralRewardTokenAmount} to address ${address}!`);

      successCallback?.();
    } catch (err: any) {
      defaultErrorHandler(err, "Failed to withdraw referral reward: ");
      return false;
    }

    return true;
  }, [formattedReferralRewardTokenAmount, web3Account.address]);

  const dialogConfig = useCallback((openProps: WithdrawNodesReferralRewardsDialogOpenProps) => {
    const dialogContent = <>
        {!userNodesSummary && <Spinner className="d-block m-auto"/>}
        {userNodesSummary && <BasicWithdrawDialogBody formattedBalance={formattedReferralRewardTokenAmount}/>}
      </>;

    const config: DialogConfig = {
      title: `Withdraw Referral Rewards`,
      content: dialogContent,
      buttons: [
        {
          kind: "confirm",
          title: `Withdraw`,
          disabled: !isCorrectWalletConnected || referralRewardTokenAmount == null || referralRewardTokenAmount < 100_000,
          onClick: () => handleConfirm(openProps.confirmCallback, openProps.successCallback)
        }
      ],
      modalFooterProps: {
        className: "justify-content-center"
      }
    }
    return config;
  }, [formattedReferralRewardTokenAmount, handleConfirm, isCorrectWalletConnected, referralRewardTokenAmount, userNodesSummary]);

  useEffect(() => {
    updateGenericConfirmationDialog(dialogConfig(openProps));
  }, [dialogConfig, openProps, updateGenericConfirmationDialog, web3Account.address, web3Account.chainId]);

  return {
    open: (openProps: WithdrawNodesReferralRewardsDialogOpenProps) => {
      setOpenProps(openProps);
      openGenericConfirmationDialog(dialogConfig(openProps));

      fetchUserNodesSummary().then(() => {
      });
    }
  }
}
