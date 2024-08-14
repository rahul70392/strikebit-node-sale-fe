import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import clientApiServices from "@/services/clientApiServices";
import wagmiConfig from "@/providers/web3/wagmiConfig";
import { useAccount } from "wagmi";
import { formatTokenAmountUI } from "@/utils/formatTokenAmountUI";
import { BasicWithdrawDialogBody } from "@/components/dialogs/BasicWithdrawDialogBody";
import { defaultErrorHandler } from "@/utils/defaultErrorHandler";
import { Erc20TokenDto, UserNodesAccountSummaryDto } from "@/generated/distribrain-nodes-api";
import { Button, Spinner } from "react-bootstrap";
import { DialogConfig, useGenericConfirmationDialog } from "@/components/dialogs/GenericConfirmationDialog";
import commonTerms from "@/data/commonTerms";
import { addErc20TokenToWallet } from "@/utils/addErc20TokenToWallet";

interface WithdrawDePinKeyPurchaseRewardsDialogOpenProps {
  userNodesSummary: UserNodesAccountSummaryDto | null,
  dePinKeyPurchaseRewardToken: Erc20TokenDto;
  confirmCallback: () => void;
  successCallback: () => void;
  refetchUserSummary: (clearCurrentData: boolean) => Promise<UserNodesAccountSummaryDto | null>;
}

interface WithdrawDePinKeyPurchaseRewardsDialogContextProps {
  open: (openProps: WithdrawDePinKeyPurchaseRewardsDialogOpenProps) => void,
}

export const useWithdrawDePinKeyPurchaseRewardsDialog = (): WithdrawDePinKeyPurchaseRewardsDialogContextProps => {
  const web3Account = useAccount();

  const isCorrectChain = web3Account.chainId === wagmiConfig.chain.id;
  const isCorrectWalletConnected = web3Account.isConnected && isCorrectChain;

  const [userNodesSummary, setUserNodesSummary] = useState<UserNodesAccountSummaryDto | null>(null);

  const [openProps, setOpenProps] = useState<WithdrawDePinKeyPurchaseRewardsDialogOpenProps | null>(null);
  const {open: openGenericConfirmationDialog, set: updateGenericConfirmationDialog} = useGenericConfirmationDialog();

  const dePinKeyPurchaseRewardTokenAmount =
    userNodesSummary?.totalDePinKeyPurchaseRewardAvailableTokenAmount ?
      BigInt(userNodesSummary?.totalDePinKeyPurchaseRewardAvailableTokenAmount) :
      null;

  const formattedDePinKeyPurchaseRewardTokenAmount =
    openProps != null && dePinKeyPurchaseRewardTokenAmount != null ?
      `${formatTokenAmountUI(dePinKeyPurchaseRewardTokenAmount, openProps.dePinKeyPurchaseRewardToken.decimals)} ${commonTerms.dePinKeyPurchaseRewardTokenName}` :
      "";

  const handleConfirm = useCallback(async function (confirmCallback?: () => void, successCallback?: () => void) {
    try {
      confirmCallback?.();

      const address = web3Account.address;
      await clientApiServices.distribrainNodesApi.nodesControllerPostDePinKeyPurchaseRewardsWithdraw({
        address: address!
      });
      toast.success(`Successfully withdrawn ${formattedDePinKeyPurchaseRewardTokenAmount} to address ${address}!`);

      successCallback?.();
    } catch (err: any) {
      defaultErrorHandler(err, `Failed to withdraw ${commonTerms.dePinKeyPurchaseRewardTokenName} reward: `);
      return false;
    }

    return true;
  }, [formattedDePinKeyPurchaseRewardTokenAmount, web3Account.address]);

  const dialogConfig = useCallback((openProps: WithdrawDePinKeyPurchaseRewardsDialogOpenProps) => {
    const dialogContent = <>
      {!userNodesSummary && <Spinner className="d-block m-auto"/>}
      {userNodesSummary && <BasicWithdrawDialogBody
          formattedBalance={formattedDePinKeyPurchaseRewardTokenAmount}
          beforeBalanceChildren={<>
            {web3Account.isConnected && <>
                <Button
                    variant={"outline-primary"}
                    style={{
                      width: "75%",
                      alignSelf: "center",
                    }}
                    onClick={() => addErc20TokenToWallet(
                      web3Account.connector!,
                      {
                        address: openProps.dePinKeyPurchaseRewardToken.address,
                        decimals: openProps.dePinKeyPurchaseRewardToken.decimals,
                        chainId: openProps.dePinKeyPurchaseRewardToken.chainId!
                      }
                    )}
                >
                    Add {commonTerms.dePinKeyPurchaseRewardTokenName} token to {web3Account.connector?.name ?? "Web3 Wallet"}
                </Button>
            </>}
          </>}
      />}
    </>;

    const config: DialogConfig = {
      title: `Withdraw ${commonTerms.dePinKeyPurchaseRewardTokenName} Rewards`,
      content: dialogContent,
      buttons: [
        {
          kind: "confirm",
          title: `Withdraw`,
          disabled: !isCorrectWalletConnected || dePinKeyPurchaseRewardTokenAmount == null || dePinKeyPurchaseRewardTokenAmount < 100_000,
          onClick: () => handleConfirm(openProps.confirmCallback, openProps.successCallback)
        }
      ],
      modalFooterProps: {
        className: "justify-content-center"
      }
    }
    return config;
  }, [userNodesSummary, formattedDePinKeyPurchaseRewardTokenAmount, isCorrectWalletConnected, dePinKeyPurchaseRewardTokenAmount, web3Account.isConnected, web3Account.connector, handleConfirm]);

  useEffect(() => {
    if (!openProps)
      return;

    updateGenericConfirmationDialog(dialogConfig(openProps));
  }, [dialogConfig, openProps, updateGenericConfirmationDialog, web3Account.address, web3Account.chainId]);

  return {
    open: (openProps: WithdrawDePinKeyPurchaseRewardsDialogOpenProps) => {
      setOpenProps(openProps);
      setUserNodesSummary(null);
      openGenericConfirmationDialog(dialogConfig(openProps));

      openProps.refetchUserSummary(false).then((newSummary) => {
        setUserNodesSummary(newSummary)
      });
    }
  }
}
